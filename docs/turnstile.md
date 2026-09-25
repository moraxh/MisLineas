# Protección de consultas con Cloudflare Turnstile

La página principal conserva la interfaz original y las consultas reales.
Turnstile protege `POST /api/lookup` incluso
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

## Interfaz y desarrollo local

El formulario original muestra Turnstile en modo claro y adaptable al ancho disponible.
El envío requiere una CURP válida y un token. El token se consume al enviar y se
renueva después de cada intento, incluidos errores. `useLookup` lo envía al backend.
Sin claves, el formulario y la API fallan de forma cerrada.

Para pruebas locales autorizadas, iniciar Next en loopback (`--hostname 127.0.0.1`)
y definir `LOCAL_LOOKUP_ENABLED=true` y `NEXT_PUBLIC_LOCAL_LOOKUP=true` en `.env.local`.
Este modo realiza consultas reales. El servidor solo lo admite en desarrollo, con
origen loopback y cabeceras de una solicitud del mismo origen. En producción,
ambas rutas requieren Turnstile aunque esas variables estén definidas.
AT&T se incluye únicamente en este modo local; requiere Chrome y la configuración
de proxy residencial del adaptador. Las credenciales nunca deben versionarse.

La URL de API pública sigue siendo `NEXT_PUBLIC_API_URL`; el modo local utiliza
el mismo origen para consultas y exportaciones. El diseño anterior y los datos
personales utilizados en pruebas no forman parte de este PR.

## Validación

Ejecutar `node --test tests/*.test.mjs`. Las pruebas usan proveedores simulados y
no transmiten CURPs reales. Antes del despliegue, configurar las claves del widget
y comprobar el flujo de Turnstile en el dominio autorizado.

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
