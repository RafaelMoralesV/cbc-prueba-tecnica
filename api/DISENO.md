## Parte 2 - Diseño y Trade-offs

1. **Agregar una fuente con poco esfuerzo**: Creo que la version final de este proyecto implicaria
   multiples aplicaciones funcionando en unisono; agregar una fuente con poco esfuerzo requiere, primero, separar
   el aplicativo que sirve estos datos de aquellos que lo ingestan. Agregar una nueva fuente implica crear un
   mini aplicativo que ingeste, normalize y suba hacia un repositorio comun los datos para que esta API pueda
   servirlos.
   De esta manera, una fuente nueva puede ser tan facil como instanciar otro aplicativo de ingesta con una
   configuracion distinta, o tan dificil como implementar un aplicativo que haga la ingesta desde multiples
   fuentes con cruce de datos entre ellas, todo esto sin tener que tocar la capa del API.

2. **Donde ejecutar y como enterarme de fallas**: La idea es una arquitectura cercana a microservicios: ingestas
   aisladas que se comunican con la API de forma asíncrona o a traves de la base. Segun costo y viabilidad: SQLite
   con un unico escritor (las ingestas envian los datos por HTTP a la API), o PostgreSQL / Service Queues para
   escrituras concurrentes. En la nube (por ejemplo Azure Container Apps Jobs, uno por fuente con su propio cron)
   una fuente que tarda 20 minutos o que falla no afecta a las demás.
   Para enterarme de fallas, cada ejecucion registra leidos, validos, rechazados y error; con alertas ante una
   ejecucion fallida, ante ausencia de ejecuciones exitosas recientes, y ante un salto en la tasa de rechazo, que
   es la señal de que una fuente cambio su formato.

3. **Solo 2 días**
   - _No negociable_: el aislamiento por fuente, la ingesta idempotente, rechazos registradros, etc.
     No muy lejos de lo que ya esta en esta primera version; la idea es tener un espacio donde crecer cuando
     inevitablemente esta entrega quede 'chica'.
   - _Lo que se queda afuera_: Dashboards o interfaces graficas. Cache y escalado fino, permisos por usuario,
     historial de versiones entre proyectos, y test exhaustivos para cada fuente.
