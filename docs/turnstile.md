# Protección de consultas con Cloudflare Turnstile

Este cambio mantiene la página de pausa. Protege `POST /api/lookup` incluso
si se invoca directamente: ninguna operadora se consulta sin una respuesta
válida de Siteverify con hostname permitido y `action=lookup`. Si falta la
configuración o Cloudflare no responde en 10 segundos, la consulta se rechaza.
No se envía la CURP a Cloudflare ni se registran tokens o claves.

## Configuración

1. Crear un widget de tipo Managed en Cloudflare Turnstile y registrar los
   dominios del frontend que se usarán (producción y, por separado, pruebas).
2. En Vercel, definir `NEXT_PUBLIC_TURNSTILE_SITE_KEY` **antes de compilar**.
3. En `.env.prod` del backend, definir `TURNSTILE_SECRET_KEY` y
   `TURNSTILE_ALLOWED_HOSTNAMES=mislineas.com.mx`. Para varios hostnames usar
   comas, sin esquema ni puerto. Reiniciar el contenedor tras cambiar variables.
4. Las claves pública y secreta deben pertenecer al mismo widget. No publicar
   la clave secreta ni colocarla en variables `NEXT_PUBLIC_*`.

La CSP permite los scripts e iframes de `https://challenges.cloudflare.com`.
Las peticiones CORS siguen usando JSON y el mismo endpoint de streaming.

## Reactivación por el mantenedor

Este PR no restaura el contenido de `src/app/page.tsx`. Cuando se reactive la
interfaz, el handler de `CurpForm` debe pasar el segundo argumento a `consultar`:

```tsx
const handleConsultar = (event: React.FormEvent, turnstileToken: string) => {
  event.preventDefault();
  if (!curpIsValid) return;
  void consultar(curp, turnstileToken);
};
```

`CurpForm` muestra el widget y deshabilita el envío hasta tener un token.
Consume el token al enviar, y monta una nueva verificación tras cada consulta,
incluidos errores y reintentos. La expiración invalida el token. Los errores
del widget ofrecen reintento; si el script no carga, se puede recargar la página.
`useLookup.consultar` requiere el token y lo incluye en el JSON de la petición.

## Verificación

```bash
node --test tests/*.test.mjs
pnpm exec tsc --noEmit
pnpm build
```

Las pruebas verifican que la API no llama proveedores cuando se rechaza la
verificación y que conserva el streaming al aceptarla. Usan respuestas simuladas
de Siteverify: éxito, configuración
ausente, tokens inválidos, rechazo de expiración/reutilización, hostname y
acción incorrectos, timeout y respuestas defectuosas. No consultan CURPs reales.

Antes de reabrir, probar la interfaz restaurada con las claves de prueba oficiales
de Cloudflare y `TURNSTILE_ALLOWED_HOSTNAMES=localhost` en un entorno local. Usar
un backend con proveedores simulados para no ejecutar consultas reales. Verificar
éxito, fallo, expiración, bloqueo del script y nueva verificación tras reintento.
Las claves de prueba nunca deben utilizarse en producción.

## Alcance y controles complementarios

Turnstile reduce automatización, pero no impone un presupuesto de consultas ni
elimina toda posibilidad de abuso. El límite existente de 10 solicitudes/minuto
por IP sigue en memoria y depende de `x-forwarded-for`: no es una cuota distribuida
ni una identidad fiable si el proxy no sanea esa cabecera.

Antes de reabrir, el operador debe evaluar límites en el perímetro (WAF/rate
limiting), un límite global de concurrencia/gasto y restricciones al acceso
directo al origen. Estas medidas requieren decisiones y configuración de
infraestructura; no se activan al fusionar este PR. CORS no impide llamadas de bots.

Documentación oficial:
- https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
- https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/
- https://developers.cloudflare.com/turnstile/troubleshooting/testing/
