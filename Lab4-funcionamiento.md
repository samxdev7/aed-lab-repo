# Lab 4 — Funcionamiento de la aplicación

> **Corrección importante**: este reporte está basado en la lectura real del código. Un análisis
> preliminar había supuesto Node.js + Express; **eso es falso**. El backend es **Java 21 + Spring
> Boot 4.1.0 (Maven)** y el frontend es **React 19 + TypeScript + Vite 8 + Tailwind CSS 4**.

---

## 1. Resumen ejecutivo

`aed-lab-repo` es un **laboratorio de algoritmos recursivos visualizados**. Contiene cuatro
"animaciones" de algoritmos clásicos, cada una con un panel interactivo en el frontend que recibe del
backend una **traza de ejecución** (secuencia de pasos/movimientos) y la reproduce paso a paso
con animaciones, sonido y efectos visuales.

| Ejercicio | Algoritmo | Tipo de recursión | Panel |
|---|---|---|---|
| 01 | Torres de Hanoi | Divide y vencerás | `HanoiPanel.tsx` |
| 02 | Salto de la Rana | Backtracking | `SaltoRanaPanel.tsx` |
| 03 | 8 Reinas | Recursión lineal descendente (verificación) | `QueensPanelV2.tsx` |
| 04 | Ordenamiento Rápido (Quicksort) | Divide y vencerás + partición Hoare | `QuickSortPanel.tsx` |

Plus una pantalla de créditos (`PresentationPanel.tsx`) y un menú selector
(`RecursiveMenuPanel.tsx`) que pre-anima cada algoritmo localmente con SVG/CSS (sin backend).

---

## 2. Stack tecnológico

### 2.1 Backend — `Backend/`

**No es Node.js.** No existe ningún `package.json` (solo un `package-lock.json` **vacío**, residuo de
un `npm install` sin manifiesto). El manifiesto real es `Backend/pom.xml`.

| Elemento | Valor | Ubicación |
|---|---|---|
| Lenguaje | Java 21 | `pom.xml:30` |
| Framework | Spring Boot **4.1.0** (`spring-boot-starter-parent`) | `pom.xml:5-10` |
| Web | `spring-boot-starter-webmvc` (sin versión explícita, la gestiona el parent) | `pom.xml:32-36` |
| Validación | `jakarta.validation-api:3.1.1` + `hibernate-validator:8.0.1.Final` | `pom.xml:44-55` |
| Tests | `spring-boot-starter-webmvc-test` (scope `test`) | `pom.xml:38-42` |
| Build | Maven Wrapper **3.9.16** (`mvnw`, `mvnw.cmd`, `.mvn/wrapper/`) | `.mvn/wrapper/maven-wrapper.properties:3` |
| Servidor | Tomcat embebido, puerto **8080** (`server.port=${port:8080}`) | `application.properties:2` |
| Serialización | Jackson (incluido en webmvc). **Cero anotaciones `@JsonProperty`/`@JsonIgnore`** en todo el proyecto | — |
| Artefacto | `groupId=uni`, `artifactId=AEDLab1`, `version=0.0.1-SNAPSHOT` | `pom.xml:11-13` |

**No hay**: base de datos (JPA/JDBC), Spring Security, WebSockets, cliente HTTP de salida,
cliente de Redis, ni contenedores Docker.

### 2.2 Frontend — `Frontend/`

| Elemento | Valor | Ubicación |
|---|---|---|
| Lenguaje | TypeScript `~6.0.2` (todo es `.tsx`/`.ts`; **no existe ningún `.jsx`**) | `package.json:30` |
| Librería UI | React `^19.2.8` + ReactDOM `^19.2.8` | `package.json:16-17` |
| Build | **Vite `^8.2.0`** + `@vitejs/plugin-react ^6.0.4` | `package.json:32, 25` |
| Módulo ES | `"type": "module"` | `package.json:5` |
| Estilos | **Tailwind CSS v4** (`^4.3.3`) vía `@tailwindcss/vite`, sin `tailwind.config.js` (sintaxis v4 con `@import "tailwindcss"` en `index.css:1`) | `package.json:13, 18` |
| Animación UI | **Framer Motion `^13.4.1`** (solo lo usa `HanoiPanel`) | `package.json:14` |
| Iconos | `lucide-react ^1.32.0` (única librería visual; no hay MUI/Chakra/shadcn) | `package.json:15` |
| Sonido | **Web Audio API nativa** (sin librerías), dos capas independientes | `useSoundEffects.ts`, `HanoiPanel.tsx:174`, `SaltoRanaPanel.tsx:59` |
| HTTP | **`fetch` nativo** — no hay axios | `HTTPMethods.tsx`, `saltoRanaService.ts` |
| Routing | **No hay React Router.** Navegación con un `useState` de unión de strings | `App.tsx:11-18` |
| Lint | ESLint 10 + typescript-eslint 8 + react-hooks + react-refresh | `package.json:21-29` |
| Tests | **No hay** framework de tests en el frontend | — |

**Scripts** (`package.json:6-11`): `dev` → `vite`, `build` → `tsc -b && vite build`,
`lint` → `eslint .`, `preview` → `vite preview`.

> ⚠️ `framer-motion` está en `package.json` pero **ausente en `package-lock.json`**: el lock está
> desincronizado respecto al manifiesto.

### 2.3 Configuración noteworthy

- `Frontend/vite.config.ts:9-11` declara un proxy `'/api' -> 'http://localhost:8080'`, pero es
  **inefectivo**: todo el código usa URLs absolutas `http://localhost:8080/api/...`.
- **No existe ningún `.env`** ni uso de `import.meta.env`. La URL base está **hardcodeada** en
  `HTTPMethods.tsx:9` (`API_KEY`) y `saltoRanaService.ts:1` (`BASE_URL`).
- CORS backend: `AedLab1Application.java:15-28` → `addMapping("/api/**")`,
  `allowedOrigins("http://localhost:5173", "http://localhost:3000")`,
  `allowedMethods("GET","POST","PUT","DELETE")` (**`PATCH` no permitido**), `allowCredentials(true)`.

---

## 3. Arquitectura

```
┌──────────────────────── FRONTEND (Vite dev server :5173) ────────────────────────┐
│  index.html → main.tsx → App.tsx                                                   │
│  App.tsx: useState<'presentation'|'menu'|'hanoi'|'frog'|'queens'|'quicksort'>     │
│      │                                                                             │
│      ├─ PresentationPanel   (no toca el backend)                                   │
│      ├─ RecursiveMenuPanel  (no toca el backend; pre-anima con SVG/CSS/rAF)       │
│      ├─ HanoiPanel          ──fetch──┐                                             │
│      ├─ SaltoRanaPanel      ──fetch──┤                                             │
│      ├─ QueensPanelV2       ──fetch──┤                                             │
│      └─ QuickSortPanel      ──fetch──┤                                             │
│                                    │                                              │
│  HTTPMethods.tsx (wrapper fetch + manejo de errores)                              │
│  NotificationContext.tsx (toasts) · useSoundEffects.ts (Web Audio) · useMouseParallax│
└────────────────────────────────────┼──────────────────────────────────────────────┘
                                     │ HTTP/JSON  (CORS)
┌────────────────────────────────────▼──────────────────────────────────────────────┐
│  BACKEND (Spring Boot / Tomcat :8080)                                             │
│  AedLab1Application (entry) → CORS WebMvcConfigurer                               │
│      │                                                                             │
│      ├─ HanoiController        ──▶ TorresHanoiServicio        (recursión + traza)  │
│      ├─ SaltoRanaController    ──▶ SaltoRanaServicio          (backtracking)       │
│      ├─ OchoReinasController   ──▶ OchoReinasService          (verificación)      │
│      └─ QuickSortController    ──▶ QuickSortService           (Hoare + traza)     │
│                                                                                   │
│  models/ : 20 records (DTOs) — Jackson serializa por nombre de componente         │
└───────────────────────────────────────────────────────────────────────────────────┘
```

### 3.1 Patrón arquitectónico

**"Motor de trazas" (backend stateless) + "reproductor visual" (frontend stateful)**

El backend **no persiste estado ni devuelve solo el resultado final**. Su responsabilidad es
ejecutar el algoritmo y devolver una **línea de tiempo completa** de lo que ocurre:

- **QuickSort** → `List<QuickSortStepDto>` con ~decenas de frames, cada uno un **snapshot completo**
  del arreglo + punteros + texto narrativo.
- **Hanoi** → array plano de exactamente `2^n − 1` movimientos.
- **Rana** → array de movimientos, cada uno con el **estado resultante completo** del tablero.
- **8 Reinas** → 8 pasos fijos (uno por reina) + bandera de validez.

El frontend toma esa traza y la **reproduce** con distintos motores según el panel
(`setInterval`, bucle `async/await + delay`, `requestAnimationFrame`, o paso-a-paso manual),
aplicando cada paso a un estado visual local.

### 3.2 Capas

**Backend (3 capas, Spring Boot):**
- `controller/` — 4 clases `@RestController`. Validación de entrada, códigos HTTP, ensamblaje de
  respuestas. Lógica de algoritmo prácticamente nula.
- `services/` — 4 clases `@Service`. **Todo el algoritmo y la generación de trazas vive aquí.**
- `models/` — 11 `record`s DTO. Sin anotaciones Jackson: los nombres JSON son los nombres de
  componente del record.

**Frontend (por feature, no por capa):**
- 1 panel por algoritmo (≈ 500–700 líneas cada uno: estado + fetch + reproducción + render + audio +
  canvas de fondo).
- 2 utilidades compartidas: `HTTPMethods.tsx` (fetch) y `useSoundEffects.ts` (audio).
- 1 contexto global: `NotificationContext.tsx` (toasts).
- `services/saltoRanaService.ts`: único cliente HTTP dedicado (el resto usa `apiRequest` directo).

---

## 4. Puntos de entrada y flujo de ejecución

### 4.1 Backend

**Único punto de entrada**: `Backend/src/main/java/uni/AEDLab1/AedLab1Application.java`

```java
 9: @SpringBootApplication
10: public class AedLab1Application {
11:     public static void main(String[] args) {
12:         SpringApplication.run(AedLab1Application.class, args);
13:     }
15:     @Bean
16:     public WebMvcConfigurer corsConfigurer() { /* CORS sobre /api/** */ }
```

El escaneo de componentes usa como base el paquete `uni.AEDLab1`, por lo que descubre
`controller/`, `services/` y `models/`. **Es la única pieza de configuración propia**: no hay
Spring Security, ni filtros, ni interceptores, ni `@ControllerAdvice`/`@ExceptionHandler`.

**Orden de la cadena de petición:**
1. Tomcat embebido
2. `DispatcherServlet` de Spring MVC
3. CORS global (`/api/**`)
4. Binding de body/path/query
5. Validación Bean Validation (**solo QuickSort**, vía `@Valid`)
6. Inyección por constructor → Controller → Service → algoritmo

### 4.2 Catálogo completo de endpoints (7)

| # | Método | Path | Parámetros | Invoca | Archivo:línea |
|---|---|---|---|---|---|
| 1 | POST | `/api/recursive/quicksort` | body `{"array":[10 ints]}` | `QuickSortService.executeQuickSort(int[])` | `QuickSortController.java:38-66` → `QuickSortService.java:48` |
| 2 | GET | `/api/hanoi/resolver/{discos}` | `@PathVariable int discos` (1–7) | `TorresHanoiServicio.resolverHanoi(int)` | `HanoiController.java:19-25` → `TorresHanoiServicio.java:12` |
| 3 | POST | `/api/recursive/eight-queens` | — | `OchoReinasService.solveWithRecursiveTrace()` | `OchoReinasController.java:36-40` → `OchoReinasService.java:35` |
| 4 | GET | `/api/recursive/eight-queens` | — | *(idem)* | `OchoReinasController.java:46-50` |
| 5 | POST | `/api/recursive/eight-queens/verify` | — | `verifyAllRecursive` + `getSolutionMatrix` | `OchoReinasController.java:56-71` → `OchoReinasService.java:100, 149` |
| 6 | PUT | `/api/recursive/eight-queens` | — | **nada** (stub) | `OchoReinasController.java:77-83` |
| 7 | GET | `/api/salto-rana/resolver` | `@RequestParam(defaultValue="3") ranasPorLado` (1–6) | `SaltoRanaServicio.resolver(int)` | `SaltoRanaController.java:25-50` → `SaltoRanaServicio.java:19` |

> **Descuido de código**: `QuickSortController.java:22` y `OchoReinasController.java:20` declaran
> `@RequestMapping("/api/")` **con barra final**, registrando literalmente `/api//recursive/...`.
> Funciona hoy porque Spring normaliza separadores consecutivos, pero el cliente llama con barra
> simple (`/api/recursive/quicksort`). `HanoiController.java:9` y `SaltoRanaController.java:13` sí
> usan prefijos correctos.

### 4.3 Frontend

**Bootstrap**: `index.html:10-11` → `<div id="root">` + `<script type="module" src="/src/main.tsx">`
→ `main.tsx:6-8` (`createRoot` + `StrictMode` + `<App/>`) → `App.tsx`.

**"Rutas" reales** — renderizado condicional sobre un `useState` (`App.tsx:11-18, 23-51`):

| Estado | Componente | Props de navegación |
|---|---|---|
| `'presentation'` (inicial) | `PresentationPanel` | `onNext → 'menu'` |
| `'menu'` | `RecursiveMenuPanel` | `onBack→'presentation'`, `onSelectHanoi/Frog/Queens/QuickSort` |
| `'hanoi'` | `HanoiPanel` | `onBack → 'menu'` |
| `'frog'` | `SaltoRanaPanel` | `onBack → 'menu'` |
| `'queens'` | `QueensPanelV2` | `onBack → 'menu'` |
| `'quicksort'` | `QuickSortPanel` | `onBack → 'menu'` |

**No hay URLs, history, deep-linking ni rutas tipo `/hanoi`.**

### 4.4 Llamadas HTTP reales del frontend (5)

| # | Método | URL | Archivo:línea |
|---|---|---|---|
| 1 | GET | `http://localhost:8080/api/hanoi/resolver/{discos}` | `HanoiPanel.tsx:212` (**fetch crudo**, URL literal en línea) |
| 2 | GET | `http://localhost:8080/api/salto-rana/resolver?ranasPorLado=3` | `services/saltoRanaService.ts:21` |
| 3 | POST | `http://localhost:8080/api/recursive/quicksort` | `QuickSortPanel.tsx:146-152` |
| 4 | POST | `http://localhost:8080/api/recursive/eight-queens/verify` | `QueensPanelV2.tsx:139-142` |
| 5 | PUT | `http://localhost:8080/api/recursive/eight-queens` | `QueensPanelV2.tsx:168` |

**Endpoints del backend NO consumidos**: `POST /api/recursive/eight-queens` y
`GET /api/recursive/eight-queens` — el panel de reinas nunca los llama.

**Endpoints del frontend que NO existen en el backend** (código muerto del Lab 1/2):
`services/algorithmService.ts:16,30,44` apunta a `POST /api/algoritmo/ordenamiento`,
`POST /api/algoritmo/busqueda`, `POST /api/algoritmo/tamano` → **404**.

### 4.5 Capa HTTP compartida — `HTTPMethods.tsx`

```ts
 9: export const API_KEY: string = "http://localhost:8080/api";
11: export async function apiRequest<Response>(url, options): Promise<Response>
```

- `method` por defecto `GET` (`:13`); siempre inyecta `Content-Type: application/json` (`:17-20`);
  `mode: 'cors'` (`:21`); body solo si `method !== "GET"` (`:24-26`).
- Manejo de `!response.ok` (`:31-47`) con mensajes por código: 404 → *"Servicio no encontrado"*,
  500 → *"Error interno en el backend"*; intenta extraer `errorJson.message`.
- Si status 204 o el content-type no es JSON → devuelve el **texto crudo** casteado (`:49-53`).
- Envuelve errores en `new Error(msg, { cause: error })` (`:56-60`).
- `fetchRequest` (`:63-65`) es un alias **no usado**.

### 4.6 Flujo completo de una animación (ej. QuickSort)

```
Usuario edita el arreglo y pulsa "INICIAR ORDENAMIENTO"
  └─ QuickSortPanel.handleStartSimulation()            (QuickSortPanel.tsx:111)
     ├─ valida localmente: 10 elementos, sin duplicados, no ordenado  (114-131)
     ├─ apiRequest(`${API_KEY}/recursive/quicksort`, {method:'POST', body:{array}})  (146)
     │    └─ Tomcat → DispatcherServlet → CORS → @Valid QuickSortArrayDto
     │       └─ QuickSortController.quicksort()        (QuickSortController.java:38)
     │          ├─ Bean Validation (@Size(min=10,max=10))
     │          ├─ 400 si null / duplicados / tamaño≠10              (45-63)
     │          └─ QuickSortService.executeQuickSort(arr) (QuickSortService.java:48)
     │             ├─ frame cabecera "compare"                       (57-58)
     │             ├─ reduce(arr,0,9,steps)   ← RECURSIÓN           (60)
     │             └─ frame pie "finish"                             (63-64)
     │          ← QuickSortResponseDto { sortedArray, steps[], message }
     ├─ for (idx = 0; idx < steps.length; idx++)       (QuickSortPanel.tsx:163)
     │    ├─ abortable vía cancelAnim.current / isMounted  (164)
     │    ├─ si action==='swap' && swapLine → intercambia SOLO la
     │    │  propiedad `position` de las tarjetas (misma key del DOM)  (171-182)
     │    ├─ vuelca pivotIndex/iPointer/jPointer/elevated/swapLine/
     │    │  phaseText/currentRange al estado React                   (185-193)
     │    └─ await delay(VELOCIDAD_POR_ACTION[action])  (195-217) + playTone(...)
     └─ cierre: "¡VERIFICANDO ARREGLO ORDENADO!" + ola de celebración por celda (220-254)
```

---

## 5. Lógica del backend en detalle — el funcionamiento recursivo de cada animación

### 5.0 Patrón común de todas las trazas

Todas las funciones recursivas del backend comparten tres convenciones:

1. **El resultado se acumula como efecto secundario**, no como valor de retorno. Las funciones de
   Hanoi y Rana devuelven `void`; las de QuickSort devuelven `void` mutando `arr` in-place. El
   resultado real (la traza) vive en una colección compartida.
2. **Registro de pasos en puntos semánticos clave**, no en cada instrucción. Cada `addStep` /
   `pasos[indice++]` captura un estado *significativo*.
3. **Profundidad implícita en los parámetros**, no en un campo explícito. Ninguna animación lleva un
   campo `depth`/`level`/`callStack`: la profundidad se codifica en los propios argumentos de la
   recursión (`n`, `start`/`end`, `targetIndex`, o el largo del tablero). El frontend no dibuja
   pilas de llamadas — dibuja los efectos acumulativos de la recursión.

---

### 5.1 Quicksort — `services/QuickSortService.java` (183 líneas)

Partición de **Hoare original (1961)**, no Lomuto. Autor declarado en el javadoc: `samxdev7`.
Constante `SIZE = 10` (`:23`).

#### Orquestador `executeQuickSort` (`:48-67`)

```java
48:  public QuickSortResponseDto executeQuickSort(int[] arrayInput) {
49:      if (arrayInput == null || arrayInput.length != SIZE || hasDuplicates(arrayInput)) {
50:          return null;                        // señal de error → el controller devuelve 400
51:      }
53:      int[] arr = arrayInput.clone();          // clonado defensivo: el input del cliente no se muta
54:      List<QuickSortStepDto> steps = new ArrayList<>();
57:      addStep(..., "INICIANDO PROCESO DE ORDENAMIENTO (Esquema Hoare Original)", "compare", {0,9});
60:      reduce(arr, 0, SIZE - 1, steps);         // ← RECURSIÓN
63:      addStep(..., "¡ORDENAMIENTO COMPLETADO!", "finish", null);
66:      return new QuickSortResponseDto(arr, steps, "Arreglo ordenado exitosamente.");
```

`hasDuplicates` (`:31-40`) usa un `HashSet<Integer>` y devuelve `true` en el primer `!seen.add(val)`.

#### La función recursiva `reduce` (`:89-154`)

```java
89:  public void reduce(int[] arr, int start, int end, List<QuickSortStepDto> steps) {
90:      if (start >= end) {
91:          if (start == end) {
92:              addStep(..., "Sub-arreglo de 1 elemento en índice " + start + " ya se encuentra ordenado.",
94:                      "new_partition", new int[]{start, end});
95:          }
96:          return;                              // start > end: subarreglo vacío, sin frame
97:      }
```

**Caso base doble**: `start > end` (vacío) retorna sin emitir frame; `start == end` (un solo
elemento) emite **un frame** `action="new_partition"` con el rango resaltado. Esto es clave: el
frontend ve explícitamente "esta rama ya no se puede partir más".

#### Selección de pivote estilo Hoare (`:99-108`)

```java
 99:      int left = start - 1;          // punteros FUERA del rango
100:      int right = end + 1;
101:      int pivotValue = arr[start];   // ← el pivote es el elemento de `start`
102:      int pivotIndex = start;
103:      int[] range = new int[]{start, end};
106:      addStep(..., "Iniciando partición Hoare en rango [" + start + " a " + end +
                       "]. Pivote seleccionado: " + pivotValue + " en índice " + start + ".",
108:              "new_partition", range);
```

A diferencia de Lomuto (pivote al final, `i = low-1`, `j = high+1`), Hoare toma el **primer**
elemento y ambos punteros arrancan fuera del rango, incrementándose **antes** de leer.

#### El bucle de partición `while (true)` (`:110-149`)

```java
110:      while (true) {
111:          do {
112:              left++;
113:              addStep(..., "Avanzando i (" + left + "): valor [" + arr[left] + "]" +
                        (arr[left] < pivotValue ? " < pivote ..., continúa avanzando." : " >= pivote ..., se detiene."),
115:                  "compare", range);
116:          } while (arr[left] < pivotValue);
118:          do {
119:              right--;
120:              addStep(..., "Retrocediendo j (" + right + "): valor [" + arr[right] + "]" +
                        (arr[right] > pivotValue ? " > pivote ..., continúa retrocediendo." : " <= pivote ..., se detiene."),
122:                  "compare", range);
123:          } while (arr[right] > pivotValue);
```

Cada avance de `left` y cada retroceso de `right` emite **un frame con mensaje narrativo que ya
anticipa si la comparación continuará o se detendrá**. El ternario de `:113` existe porque en la
**primera** iteración `right` todavía vale `end + 1` (fuera de rango), así que se publica `j = null`
en vez de un índice inválido.

Cruce de punteros (`:125-130`):
```java
125:      if (left >= right) {
126:          addStep(..., "Punteros cruzados (i=" + left + " >= j=" + right + "). Partición Hoare concluida. Punto de corte en índice " + right + ".",
128:              "done", range);
129:          break;
130:      }
```

Par, swap y confirmación (`:132-148`) — **orden snapshot → mutación → snapshot**:
```java
133:      addStep(..., "¡Par encontrado! arr[3]=9 y arr[5]=3. Preparando intercambio...", "found", range);
138:      swap(arr, left, right);                              // ← mutación real
141:      addStep(..., "Intercambiando arr[" + left + "] con arr[" + right + "]...",
143:              "swap", range);                               // lleva swapLine = new SwapLineDto(left,right)
146:      addStep(..., "Intercambio completado exitosamente.", "done", range);
```

Ese triple frame es lo que permite al frontend dibujar el arco del intercambio: en `action==='swap'`
recibe `swapLine {from, to}` y una transición CSS de 700 ms, mientras `elevated=[left,right]` eleva
las dos tarjetas.

#### La recursión (`:151-153`)

```java
151:      // Llamadas recursivas del esquema Hoare: [start, right] y [right + 1, end]
152:      reduce(arr, start, right, steps);
153:      reduce(arr, right + 1, end, steps);
```

Es la división clásica de Hoare: **el corte es `right`, no `pivotIndex`**, y el lado derecho empieza
en `right + 1`. Por eso los dos rangos son disjuntos y la recursión **siempre termina** (garantía
ausente en particiones mal implementadas). No hay límite de profundidad; con la entrada restringida
a 10 elementos únicos el riesgo de `StackOverflowError` es nulo.

#### `addStep` — el corazón de la animación (`:169-182`)

```java
169:  private void addStep(List<QuickSortStepDto> steps, int[] arr, Integer pivot, Integer i, Integer j,
170:                      int[] elevated, SwapLineDto swapLine, String phaseText, String action, int[] range) {
171:      steps.add(new QuickSortStepDto(
172:          arr.clone(),                                                // ← COPIA PROFUNDA
176:          pivot, i, j,
              elevated != null ? elevated.clone() : new int[0],
177:          swapLine, phaseText, action,
180:          range != null ? range.clone() : null
          ));
182:  }
```

El **clonado en cada frame** (`arr.clone()`, `elevated.clone()`, `range.clone()`) es lo que permite
al frontend hacer *time-travel*: cada paso es autocontenido y puede renderizarse sin depender de los
anteriores. Coste: `O(n_frames × 10)` enteros. `pivot`/`i`/`j` son `Integer` (boxed) precisamente
para poder ser `null`.

**Valores del discriminante `action`** (todos presentes en el código):

| `action` | Significado | Emite en |
|---|---|---|
| `"compare"` | avance/retroceso de puntero o arranque | `:58, 115, 122` |
| `"new_partition"` | se abre (o se cierra) un subarreglo a particionar | `:94, 108` |
| `"found"` | par candidato detectado, aún sin intercambiar | `:135` |
| `"swap"` | intercambio ejecutado (lleva `swapLine`) | `:143` |
| `"done"` | cruce de punteros / swap completado | `:128, 148` |
| `"finish"` | arreglo ordenado | `:64` |

`swap` (`:163-167`) intercambia tres variables. El wrapper `quickSort(int[])` (`:75-78`) existe por
retrocompatibilidad y **no lo invoca ningún controlador**: construye y descarta la traza entera para
devolver solo el arreglo.

---

### 5.2 Torres de Hanoi — `services/TorresHanoiServicio.java` (33 líneas)

**Divide y vencerás puro.** Es el servicio más pequeño y el más "clásico" en estructura recursiva.

```java
10:      private int indice;                        // ← ESTADO MUTABLE DE INSTANCIA
12:      public TorresHanoiDto[] resolverHanoi(int n) {
14:          int totalMovimientos = (int) Math.pow(2, n) - 1;
15:          TorresHanoiDto[] pasos = new TorresHanoiDto[totalMovimientos];   // ← PREDIMENSIONADO
18:          this.indice = 0;                       // reinicio del índice
20:          algoritmoHanoi(n, "A", "C", "B", pasos);
21:          return pasos;
22:      }
24:      private void algoritmoHanoi(int n, String origen, String destino, String auxiliar, TorresHanoiDto[] pasos) {
25:          if (n == 1) {                                                   // ← CASO BASE
26:              pasos[indice++] = new TorresHanoiDto(1, origen, destino);
27:          } else {
28:              algoritmoHanoi(n - 1, origen, auxiliar, destino, pasos);   // 1) n-1 → auxiliar
29:              pasos[indice++] = new TorresHanoiDto(n, origen, destino);  // 2) el disco n
30:              algoritmoHanoi(n - 1, auxiliar, destino, origen, pasos);   // 3) n-1 → destino
31:          }
32:      }
```

#### Cómo funciona la recursión

1. **Caso base `n == 1`** (`:25`): un solo disco, un solo movimiento, y se escribe. **No existe caso
   base `n == 0`** — el algoritmo depende de que `n ≥ 1`, garantizado por el controlador
   (`HanoiController.java:21`). Con `n == 0` el índice nunca se detendría.
2. **Orden canónico**: (a) mover `n−1` de `origen` a `auxiliar` usando `destino`;
   (b) **registrar el movimiento del disco `n`** de `origen` a `destino`;
   (c) mover `n−1` de `auxiliar` a `destino` usando `origen`.
   Fíjate en cómo la llamada recursiva **permuta los roles de las torres** entre sí: `origen` se
   vuelve `auxiliar`, `auxiliar` se vuelve `origen`. Esa permutación de argumentos *es* la
   recursión.
3. **Profundidad = `n`**. El parámetro `n` decrementa en cada nivel y también identifica el disco en
   el DTO, así que el frontend obtiene gratis el "nivel" de cada movimiento.
4. **Puntos de registro**: exactamente dos (`pasos[indice++]` en `:26` y `:29`).
5. **Trazas pre-calculadas, no incrementales**: el arreglo se dimensiona a `2^n − 1` (`:15`) y se
   llena secuencialmente. Esto hace el overrun **imposible**, pero no hay ninguna verificación.

#### ⚠️ Defecto arquitectónico: estado mutable en bean singleton

`indice` es un **campo de instancia de un `@Service` singleton, sin `synchronized` ni `ThreadLocal`**.
Dos peticiones concurrentes compartirían el mismo contador → `ArrayIndexOutOfBoundsException` o trazas
mezcladas. Es la mayor fragilidad de este servicio (y el mismo patrón aparece en SaltoRana).

#### Lo que el cliente NO recibe

El DTO es `record TorresHanoiDto(int disco, String origen, String destino)` — **la torre auxiliar no
viaja al cliente**, aunque es parte esencial de la recursión. Tampoco existe campo `step`/`mensaje`:
**la posición en el array ES el número de movimiento**. Por eso el error del endpoint de Hanoi tiene
forma distinta (Spring devuelve `/error` con el body estándar, normalmente **HTTP 500**, porque
`HanoiController.java:21-23` lanza `IllegalArgumentException` en vez de devolver 4xx —
y el propio cliente lo contempla en `HanoiPanel.tsx:34`).

---

### 5.3 Salto de la Rana — `services/SaltoRanaServicio.java` (127 líneas)

**Backtracking con deshacer explícito.** Es la única animación que realmente *explora* un espacio de
búsqueda y *retrocede*.

#### Estado y orquestador (`:11-34`)

```java
11:      private static final char RANA_VERDE = 'V';
12:      private static final char RANA_CAFE  = 'C';
13:      private static final char ESPACIO_VACIO = '_';
16:      private MovimientoRanaDto[] movimientos;      // ← ESTADO MUTABLE DE INSTANCIA
17:      private int cantidadMovimientos;               // ← ESTADO MUTABLE DE INSTANCIA
19:      public MovimientoRanaDto[] resolver(int ranasPorLado) {
20:          char[] estadoActual = construirEstadoInicial(ranasPorLado);   // "VVV_CCC"
23:          int capacidadMaxima = ranasPorLado * (ranasPorLado + 2);    // capacidad conocida
24:          movimientos = new MovimientoRanaDto[capacidadMaxima];
25:          cantidadMovimientos = 0;
27:          boolean seEncontroSolucion = intentarResolverDesde(estadoActual);   // ← RECURSIÓN
28:          if (!seEncontroSolucion) {
29:              throw new IllegalStateException("No se encontró solución para " + ranasPorLado + " ranas por lado.");
33:          return Arrays.copyOf(movimientos, cantidadMovimientos);   // ← recorte al tamaño real
```

`construirEstadoInicial` (`:36-48`) produce `V×n` + `_` + `C×n` (largo `2n+1`).
`esEstadoSolucion` (`:50-60`) exige `C…C _ V…V` usando `mitad = estado.length / 2`.

#### La recursión de exploración `intentarResolverDesde` (`:63-94`)

```java
63:      private boolean intentarResolverDesde(char[] estado) {
64:          if (esEstadoSolucion(estado)) {          // ← CASO BASE: meta alcanzada
66:              return true;
67:          }
68:          int ultimoIndice = estado.length - 1;
70:          for (int posicion = 0; posicion <= ultimoIndice; posicion++) {
72:              if (estado[posicion] == RANA_VERDE) {
73:                  if (intentarMovimiento(estado, posicion, posicion + 1, ultimoIndice, RANA_VERDE))  return true;
76:                  if (posicion + 2 <= ultimoIndice && estado[posicion + 1] == RANA_CAFE
77:                      && intentarMovimiento(estado, posicion, posicion + 2, ultimoIndice, RANA_VERDE)) return true;
79:              }
82:              if (estado[posicion] == RANA_CAFE) {
83:                  if (intentarMovimiento(estado, posicion, posicion - 1, ultimoIndice, RANA_CAFE))   return true;
86:                  if (posicion - 2 >= 0 && estado[posicion - 1] == RANA_VERDE
87:                      && intentarMovimiento(estado, posicion, posicion - 2, ultimoIndico, RANA_CAFE))  return true;
89:              }
91:          }
93:          return false;                             // ← agotamiento: backtrack
94:      }
```

**Las 4 reglas de movimiento** (búsqueda exhaustiva en orden fijo, izquierda→derecha):

| Regla | Condición | Dirección |
|---|---|---|
| Verde avanza 1 | destino vacío | → |
| Verde salta 2 sobre una café | `estado[pos+1] == 'C'` | → |
| Café retrocede 1 | destino vacío | ← |
| Café salta 2 sobre una verde | `estado[pos-1] == 'V'` | ← |

Detalles importantes:
- `estado` es un `char[]` que se **muta in-place** y se pasa por referencia; **no se clona por nivel**.
- **No hay conjunto de visitados ni memoización ni detección de ciclos.** La terminación depende
  exclusivamente del mecanismo de deshacer. El coste es exponencial: la misma rama se reexplora
  muchas veces.
- El caso base **no emite frame**: la posición final ya quedó registrada por el movimiento que llevó
  hasta ella.

#### El movimiento + registro + **deshacer**: `intentarMovimiento` (`:96-120`)

Esta es la pieza clave del backtracking:

```java
 96:      private boolean intentarMovimiento(char[] estado, int origen, int destino, int ultimoIndice, char tipoFicha) {
 99:          if (destino < 0 || destino > ultimoIndice || estado[destino] != ESPACIO_VACIO) {
101:              return false;                        // movimiento ilegal → NO registra frame
102:          }
103:          intercambiar(estado, origen, destino);   // ① aplica el movimiento
106:          movimientos[cantidadMovimientos] = new MovimientoRanaDto(
107:              cantidadMovimientos + 1, origen, destino, tipoFicha, new String(estado));   // ② REGISTRA (post-swap)
109:          cantidadMovimientos++;
111:          if (intentarResolverDesde(estado)) {      // ③ ramifica con el mismo array mutado
112:              return true;
113:          }
116:          cantidadMovimientos--;                    // ④ DESHACER: desenrollar la rama fallida
117:          movimientos[cantidadMovimientos] = null;  //    anula la ranura (sin huecos en la traza)
118:          intercambiar(estado, destino, origen);   //    restaura el swap
119:          return false;
120:      }
```

Los cuatro puntos críticos:

1. **Guarda de legalidad** (`:99-101`): destino en rango y debe ser `_`. Devuelve `false`
   **sin registrar**, así que un movimiento inválido no ensucia la animación.
2. **Orden snapshot-crash-clone** (`:103` luego `:107`): primero `intercambiar`, después
   `new String(estado)`. El string es el **estado posterior al movimiento** y es una **copia
   profunda** — imprescindible, porque `estado` se sigue mutando en niveles inferiores.
3. **`numeroMovimiento` es 1-indexado** (`cantidadMovimientos + 1`).
4. **Deshacer en orden inverso** (`:116-118`): cada nivel que retorna `false` desenrolla **su**
   movimiento, y como se hace al propagarse la pila, toda la rama fallida queda revertida. El
   resultado final es que `movimientos` contiene **exactamente** la solución, sin los movimientos de
   los caminos descartados.

`intercambiar` (`:122-126`) es un swap de 3 líneas.

#### ⚠️ Mismo defecto de concurrencia

`movimientos` y `cantidadMovimientos` son campos de instancia de un `@Service` singleton, sin
sincronizar (`:16-17`). Peticiones concurrentes se pisan.

#### Ensamblaje de la respuesta (en el controller, no en el servicio)

`SaltoRanaController.java:36-44` — nótese que **`estadoInicial` se reconstruye duplicando la lógica
del servicio** (`:40`) y `estadoFinal` se **deriva del último movimiento** (`:37`):

```java
39:      SaltoRanaRespuestaDto respuesta = new SaltoRanaRespuestaDto(
40:          "V".repeat(ranasPorLado) + "_" + "C".repeat(ranasPorLado),   // estadoInicial
41:          estadoFinal,                                                // estadoFinal
42:          movimientos.length,                                         // totalMovimientos
43:          Arrays.asList(movimientos)
44:      );
```

---

### 5.4 8 Reinas — `services/OchoReinasService.java` (157 líneas)

> ⚠️ **Hallazgo estructural importante**: la solución **no se calcula**. Es una constante hardcodeada.
> No existe backtracking ni generación de soluciones; no hay un `resolver()` recursivo que explore el
> espacio de búsqueda.

```java
20:      public static final int TAMANO = 8;
27:      public static final int[] SOLUCION = {0, 4, 7, 5, 2, 6, 1, 3};
```

El comentario (`:22-26`) documenta la notación: índice = fila (0-7), valor = columna, casillas
`a8, e7, h6, f5, c4, g3, b2, d1`.

#### Generador de la traza `solveWithRecursiveTrace` (`:35-63`)

```java
35:      public EightQueensResponseDto solveWithRecursiveTrace() {
36:          List<QueenStepDto> steps = new ArrayList<>();
37:          int[] placed = new int[TAMANO];
39:          for (int r = 0; r < TAMANO; r++) {        // ← BUCLO ITERATIVO, no recursivo
40:              int c = SOLUCION[r];
41:              placed[r] = c;
44:              boolean safe = isSafeRecursive(r, c, placed, r - 1);   // ← RECURSIÓN (verificación)
46:              char file = (char) ('a' + c);
47:              int rank = 8 - r;
48:              String notation = "REINA " + (r + 1) + " [" + Character.toUpperCase(file) + rank + "]";
49:              String msg = "Reina " + (r + 1) + " colocada en (" + r + ", " + c + ") y verificada recursivamente sin amenazas.";
51:              steps.add(new QueenStepDto(r + 1, r, c, notation, safe, msg));
52:          }
54:          int[][] solutionMatrix = getSolutionMatrix();
55:          boolean allValid = verifyAllRecursive(SOLUCION, TAMANO);
57:          return new EightQueensResponseDto(solutionMatrix, steps, allValid, "Las ocho reinas ... verificadas recursivamente sin amenazas mutuas.");
```

El recorrido es **iterativo** (un frame por fila, exactamente 8) y la recursión se usa para
**verificar** cada colocación contra las anteriores.

#### Verificador recursivo 1: `isSafeRecursive` (`:75-91`)

```java
75:      public boolean isSafeRecursive(int row, int col, int[] positions, int targetIndex) {
77:          if (targetIndex < 0) {              // ← CASO BASE: se revisaron todas sin conflicto
79:              return true;
80:          }
81:          int prevRow = targetIndex;
82:          int prevCol = positions[targetIndex];
85:          if (row == prevRow || col == prevCol || Math.abs(row - prevRow) == Math.abs(col - prevCol)) {
86:              return false;                    // ← CORTE INMEDIATO en el primer conflicto
87:          }
90:          return isSafeRecursive(row, col, positions, targetIndex - 1);   // ← retrocediendo hacia atrás
91:      }
```

- **Profundidad**: `targetIndex + 1`, decreciendo de uno en uno. Puramente descendente.
- **Detección (`:85`)**: misma fila, misma columna, y **ambas diagonales** vía
  `|row − prevRow| == |col − prevCol|`.
- Nótese que `row == prevRow` **nunca puede cumplirse** en la práctica, porque se invoca con
  `targetIndex = r − 1 < r = row`. Esa cláusula es código muerto en el contexto actual (quedaría
  para un uso con `targetIndex ≥ row`).
- **Corta en el primer conflicto** con `false` — es una versión *corta-circuitada* del backtracking
  clásico, sin registro de pasos: el usuario no ve **qué** reina causou el fallo.

#### Verificador recursivo 2: `verifyAllRecursive` (`:100-115`)

```java
100:     public boolean verifyAllRecursive(int[] positions, int n) {
101:         if (positions == null || n <= 1) {   // ← CASO BASE doble
103:             return true;
104:         }
105:         int lastRow = n - 1;
106:         int lastCol = positions[lastRow];
109:         if (!isSafeRecursive(lastRow, lastCol, positions, lastRow - 1)) {
110:             return false;                    // ← si la última falla, todo falla
112:         }
114:         return verifyAllRecursive(positions, n - 1);   // ← recursión sobre el prefijo
115:     }
```

Comprueba la **última** reina contra todas las anteriores y delega en el prefijo. Con `n = 1`
devuelve `true` sin comprobar nada (una sola reina no puede amenazarse). Es **O(n²)** con dos
funciones recursivas anidadas: `verifyAllRecursive` → `isSafeRecursive` → `isSafeRecursive` → …
Se invoca con `SOLUCION`/`TAMANO` desde el controller (`:58`) y desde
`solveWithRecursiveTrace` (`:55`).

#### Verificador de matriz `verifyMatrixRecursive` (`:123-142`) — **sin endpoint**

Convierte una matriz `int[N][2]` a vector de columnas y delega en `verifyAllRecursive`. **No lo
expone ningún controller**: es el residuo de una API de queen interactivo que ya no se expone
(junto con los DTO huérfanos `QueenPositionDto` y `MoveQueenDto`). Solo lo usa el test
`OchoReinasServiceTest.java:76,78,79`.

#### `getSolutionMatrix` (`:149-156`)

`int[8][2]` con `[fila, columna]` → `[[0,0],[1,4],[2,7],[3,5],[4,2],[5,6],[6,1],[7,3]]`.

---

### 5.5 Comparativa: cómo se manifiesta la recursión en cada animación

| | QuickSort | Hanoi | Salto Rana | 8 Reinas |
|---|---|---|---|---|
| **Tipo** | Divide y vencerás | Divide y vencerás | Backtracking | Verificación lineal |
| **Firma recursiva** | `reduce(int[], start, end, List<Step>)` | `algoritmoHanoi(int, String, String, String, Dto[])` | `intentarResolverDesde(char[])` | `isSafeRecursive(int,int,int[],int)` + `verifyAllRecursive(int[],int)` |
| **Retorno** | `void` (efecto en `arr`) | `void` | `boolean` (¿encontrado?) | `boolean` |
| **Caso base** | `start >= end` (doble) | `n == 1` (**sin `n == 0`**) | `esEstadoSolucion(estado)` | `targetIndex < 0` / `n <= 1` |
| **Profundidad codificada en** | rango `[start, end]` | parámetro `n` (= nº de disco) | largo del corredor | `targetIndex` |
| **Estado compartido** | ninguno (todo en args) | campo `indice` ⚠️ | campos `movimientos` + `cantidadMovimientos` ⚠️ | ninguno |
| **Registro de frames** | `addStep` con clonado profundo (9 campos) | `pasos[indice++]` (3 campos) | `movimientos[n++] = ...` (5 campos + copia del estado) | `steps.add(QueenStepDto)` (6 campos) |
| **Cantidad de frames** | ~decenas (dinámica) | exactamente `2^n − 1` | `N(N+2)` como capacidad, recortado a los usados | exactamente 8 |
| **Mecanismo de retroceso** | no aplica (partición divide) | no aplica | **`cantidadMovimientos--` + swap inverso** | corte corto (`return false`) |
| **Desfase de la traza** | el estado se registra **antes y después** de cada mutación | solo se registran **movimientos** (no hay "no-ops") | solo el estado **post-movimiento** | un frame por **reina colocada** |

---

## 6. Formato exacto de las respuestas JSON

Todos los DTO son `record` de Java serializados por Jackson **por nombre de componente**. **No existe
ninguna anotación `@JsonProperty`, `@JsonIgnore`, `@JsonInclude` ni `@JsonFormat`** en todo el
proyecto: los nombres JSON son literalmente los identificadores del record.

### 6.1 `POST /api/recursive/quicksort` → `QuickSortResponseDto`

```json
{
  "sortedArray": [4, 1, 9, 2, 7, 3, 10, 5, 6, 8],
  "steps": [
    {
      "array":     [4, 1, 9, 2, 7, 3, 10, 5, 6, 8],
      "pivot":     0,
      "i":         3,
      "j":         5,
      "elevated":  [3, 5],
      "swapLine":  { "from": 3, "to": 5 },
      "phaseText": "¡Par encontrado! arr[3]=9 y arr[5]=3. Preparando intercambio...",
      "action":    "found",
      "range":     [0, 9]
    }
  ],
  "message": "Arreglo ordenado exitosamente."
}
```

`QuickSortStepDto` (`models/QuickSortStepDto.java:19-29`):

| Campo | Tipo | ¿`null`? | Notas |
|---|---|---|---|
| `array` | `int[]` (siempre 10) | No | `arr.clone()` por frame |
| `pivot` | `int` (boxed) | Sí | **Índice**, no el valor; `null` en cabeceras/pies y en subarreglos de 1 elemento |
| `i` | `int` (boxed) | Sí | puntero `left` |
| `j` | `int` (boxed) | Sí | puntero `right`; el ternario `:113` publica `null` si aún está fuera de rango |
| `elevated` | `int[]` | No (normalizado a `[]`) | `[left,right]` solo en `"found"` y `"swap"` |
| `swapLine` | `{from:int,to:int}` | **Sí** | solo en `action == "swap"` |
| `phaseText` | `string` | No | texto narrativo en español |
| `action` | `string` | No | `"compare"` \| `"new_partition"` \| `"found"` \| `"swap"` \| `"done"` \| `"finish"` |
| `range` | `[int,int]` | **Sí** | `null` solo en el frame `"finish"`; define el subarreglo activo a resaltar |

Request: `{"array":[10 ints distintos]}` (`QuickSortArrayDto.java:18-23`, con
`@NotNull @NotEmpty @Size(min=10,max=10)`).

Errores 400 del controller (`QuickSortController.java:46, 52, 60`): `{"message": "..."}` con uno de:
- `"Error: Los datos de entrada no pueden ser nulos."`
- `"Error: El arreglo no debe contener elementos duplicados."`
- `"El arreglo no se ordenó correctamente. Debe tener 10 elementos obligatoriamente."`

Los fallos de Bean Validation producen el body estándar de Spring:
`{"timestamp":…,"status":400,"error":"Bad Request","message":"El arreglo debe tener obligatoriamente 10 elementos.","path":…}`.

### 6.2 `GET /api/hanoi/resolver/{discos}` → `TorresHanoiDto[]` (**array plano, sin envoltura**)

```json
[
  { "disco": 1, "origen": "A", "destino": "B" },
  { "disco": 1, "origen": "B", "destino": "C" },
  { "disco": 2, "origen": "A", "destino": "C" },
  { "disco": 1, "origen": "A", "destino": "B" }
]
```

Exactamente `2^n − 1` elementos. **Sin campo `step`, sin `message`, sin `auxiliar`**: la posición en
el array ES el número de movimiento. Al no haber envoltura, los errores tienen forma distinta al
resto de endpoints.

### 6.3 `POST|GET /api/recursive/eight-queens` → `EightQueensResponseDto`

```json
{
  "solution": [[0,0],[1,4],[2,7],[3,5],[4,2],[5,6],[6,1],[7,3]],
  "steps": [
    { "step": 1, "row": 0, "col": 0, "notation": "REINA 1 [A8]", "verified": true,
      "message": "Reina 1 colocada en (0, 0) y verificada recursivamente sin amenazas." }
  ],
  "valid": true,
  "message": "Las ocho reinas de la combinación establecida fueron verificadas recursivamente sin amenazas mutuas."
}
```

`steps` tiene **siempre exactamente 8** elementos. `solution` es un array de 8 pares
`[fila, columna]` (**no** una matriz 8×8). `notation` real: `"REINA <n> [<file><rank>]"`, ej.
`"REINA 1 [A8]"`. Siempre **200**.

### 6.4 `POST /api/recursive/eight-queens/verify` → `HashMap` (**sin tipar**)

Construido con `new HashMap<>()` (`OchoReinasController.java:60`), así que **el orden de las claves
JSON no está garantizado** (a diferencia de los `record`).

```json
{ "valid": true,  "solution": [[0,0],[1,4],…], "message": "Verificación recursiva exitosa: …" }
{ "valid": false, "solution": [[0,0],[1,4],…], "message": "Error: Se detectaron amenazas entre reinas." }   // 400
```

Como la solución es constante, en la práctica siempre devuelve `valid: true` / 200.

### 6.5 `PUT /api/recursive/eight-queens` → stub

```json
{ "message": "El tablero de 8 reinas se reinició correctamente.", "queens": [] }
```

`queens` es `new int[0][0]` (`:81`), emitido como `[]`. **No toca el servicio ni estado alguno**:
siempre 200, no hay nada que reiniciar en el servidor.

### 6.6 `GET /api/salto-rana/resolver` → `SaltoRanaRespuestaDto`

```json
{
  "estadoInicial": "VVV_CCC",
  "estadoFinal":   "CCC_VVV",
  "totalMovimientos": 15,
  "movimientos": [
    { "numeroMovimiento": 1, "posicionOrigen": 2, "posicionDestino": 3,
      "tipoFicha": "V", "estadoResultante": "VV_CVCC" }
  ]
}
```

`MovimientoRanaDto` (`models/MovimientoRanaDto.java:3-9`): `numeroMovimiento` (1..N),
`posicionOrigen`, `posicionDestino`, `tipoFicha` (`char` → `"V"`/`"C"`, 1 carácter), y
`estadoResultante` (string de largo `2n+1`, **copia profunda post-movimiento**).

Errores: **texto plano** (`text/plain`), no JSON, porque el controller devuelve
`ResponseEntity<String>` y aplica `StringHttpMessageConverter`:
- 400 `"Error: La cantidad de ranas por lado debe estar entre 1 y 6."` (`:27-33`)
- 400 `"Error: No se encontró solución para N ranas por lado."` (`:47-49`, captura
  `IllegalStateException`)

---

## 7. Consumo y reproducción en el frontend

### 7.1 Tabla resumen

| Panel | Motor de reproducción | Velocidad | Controles |
|---|---|---|---|
| `HanoiPanel.tsx` (517 l.) | `setInterval` + Framer Motion (4 keyframes) | 3 niveles (`lenta` 1300 ms, `normal` 700 ms, `rapida` 400 ms) `:50-55` | discos 1–7, velocidad, **Ejecutar**, **Pausa/Reanudar**, Reset |
| `SaltoRanaPanel.tsx` (689 l.) | **`requestAnimationFrame`** + `setTimeout` encadenado | 3 niveles (950/550/280 ms + pausas 550/260/90 ms) `:34-44` | velocidad, **Play/Pause**, Reset |
| `QuickSortPanel.tsx` (622 l.) | bucle `async/await` con `delay()` por `action` | **hardcodeada por action**: `new_partition` 700 ms, `found` 600, `swap` 800, `done` 450, `finish` 300, `compare` 450 | **solo Iniciar** + Reset — **sin pausa, sin paso, sin selector de velocidad** |
| `QueensPanelV2.tsx` (542 l.) | **paso a paso manual** (un clic = una reina) | highlight se apaga a los 10 000 ms `:31` | **Insertar reina** (Step), Reset — **sin play/pause/velocidad** |

### 7.2 QuickSort: el caso más complejo

- **Recibe la traza entera y la recorre en un `for`** (`:163`), no la guarda en estado.
- **Abortable**: `if (!isMounted.current || cancelAnim.current) break;` (`:164`). El botón Reset pone
  `cancelAnim.current = true` (`:272`) → cancelación inmediata sin condición de carrera.
- **El intercambio se hace mutando solo la propiedad `position`** de las tarjetas (`:175-182`),
  manteniendo la misma `key` (`item.id`, `:473`). Así el DOM no se recrea y el movimiento se produce
  por transición CSS de `left: calc(pos * 10%)` (`:475`).
- **Switch por `action`** (`:195-217`) que decide el `delay` y dispara `playTone(...)`.
- **Arco de swap en SVG** (`:536-554`): `<path>` con curva cuadrática `M … Q …`, `markerEnd` con
  `<defs><marker id="arrowhead">` (`:548-552`) y `strokeDasharray="5 5"`.
- **Cierre con ola de celebración** (`:220-254`): recorre las 10 celdas con 120 ms cada una y tono
  incremental `420 + c*50` Hz, luego acorde final 880 Hz + 1320 Hz.
- **Validación duplicada en cliente** (`:114-131`) que replica la del backend.

### 7.3 Hanoi: animación por keyframes

- `ejecutarSiguientePaso()` (`:232-252`) aplica el movimiento con un `setTorres(prev => ...)`
  funcional: quita el disco del origen con `filter(d => d !== disco)` y lo **apila al final** del
  destino (`:241-242`).
- `layout={false}` explícito en Framer Motion (`:450`, con comentario: el FLIP automático competía
  con el `animate` manual).
- Animación de 4 keyframes (`:457-464`):
  `x:[startX,startX,0,0]`, `y:[startY,peakY,peakY,0]` — permanece en altura origen → sube sobre la
  barra → vuela horizontalmente → desciende.
  `transition={{ duration: VELOCIDADES[vel].duracion, times:[0,0.25,0.75,1], ease:'easeInOut' }}`.
- **Geometría medida del DOM** con `getBoundingClientRect()` y **dividida por `scale`** (`:411-423`)
  para compensar el escalado responsivo del `viewBox` de 1400×500.
- `onAnimationComplete` dispara el sonido de impacto (`:465-471`).
- **No usa `apiRequest`**: hace `fetch` crudo con la URL literal (`:212`).

### 7.4 Salto de la Rana: el más refinado visualmente

- Reproducción con **`requestAnimationFrame`**, no `setInterval`: mide `performance.now()`, calcula
  `progreso = (now - inicio) / duracion`, aplica `aplicarSuavizado` (ease-in-out cuadrático,
  `:84-85`), y reencola mientras `progreso < 1` (`:349-355`).
- Al completar: sonido de aterrizaje, mueve la ficha destino←origen, limpia animación e incrementa
  índice (`:357-369`); si sigue reproduciendo, `setTimeout` para el siguiente salto (`:377-382`).
- **Ref-espejo del estado** (`posicionesRef`, `movimientosRef`, `indiceRef`, `velocidadRef`, …,
  `:222-235`) para leer valores frescos dentro de rAF/`setTimeout` sin closures obsoletas.
- Render **100 % SVG** (`:506-623`): rocas, juncos, flores de loto, 3 olas con `@keyframes` inyectados
  en `<style>` dentro del `<svg>` (`:531`), y la rana en vuelo con **parábola**
  `ALT * 4p(1−p)` (`:80-81`) más estiramiento `1 + 0.12·sin(πp)` (`:613`).
- **Carga única**: llama `resolverSaltoDeRana(3)` en un `useEffect` con `deps []` (`:294-311`) —
  siempre 3 ranas por lado. No hay botón de re-fetch.
- **Descarta parte de la respuesta**: guarda solo `respuesta.movimientos` (`:299`); ignora
  `estadoInicial`, `estadoFinal` y `totalMovimientos` aunque el tipo los declara.

### 7.5 8 Reinas: la solución está hardcodeada en el cliente

- `QueensPanelV2.tsx:11`: **`const solution = [0, 4, 7, 5, 2, 6, 1, 3];`** — duplica exactamente la
  constante del backend en lugar de consumir `POST|GET /api/recursive/eight-queens`, que existe y
  devuelve la traza completa con `QueenStepDto`.
- Solo usa el backend para **`/verify`** (`:139-142`) y el **`PUT` de reset** (`:168`).
- **Si el backend está caído, marca `isVerified = true` de todos modos** (`:151-153`, con comentario
  explícito *"En caso de que el backend esté offline durante pruebas aisladas"*) → el panel puede dar
  un falso positivo de verificación.
- Interacción extra: **drag & drop** de reinas con `onDragOver/onDragLeave/onDrop` (`:297-313`) y
  líneas de ataque en SVG con `<mask id="hole-attack">` que recorta la casilla de la reina (`:336-381`).
- Tiñe por **anillos de Chebyshev** respecto al centro (3.5, 3.5) (`:272`) para propagar el frente de
  onda de `expansionRing`.

---

## 8. Capa de audio

**Dos capas independientes**, sin ningún archivo de audio en disco (el único `Ranita.mp3` de 17 KB
está sin usar):

### 8.1 `useSoundEffects.ts` (266 líneas) — síntesis Web Audio

`type Engine = { ctx: AudioContext; out: AudioNode; noise: AudioBuffer }` (`:3`).
`ensure()` (`:115-138`) crea `AudioContext` + `DynamicsCompressor` + master gain 0.9 y un buffer de
ruido blanco de 1 s, con `resume()` si está suspendido, todo en `try/catch` silencioso.

| Sonido | Línea | Síntesis |
|---|---|---|
| `playHoverSound` | 141-146 | sine 520→760 Hz, 0.09 s |
| `playClickSound` | 149-157 | 4 tonos apilados: 620→980 (pop), 1318 (campana Mi), 1975, 2637 |
| `playDiskSound(pitch)` | 160-172 | sine 260p→110p + triangle 720p→300p + resonancia + noise bandpass |
| `playFrogSound` | 175-181 | dos `croak()` (95→130 Hz y 120→175 Hz) — "rib-bit" |
| `playSplashSound` | 184-191 | noise bandpass 1400→600 + 2 burbujas sine |
| `playChessSound` | 194-203 | fricción noise 500→250, golpe 180→70, clac 3200→2500, "tink" 1900→900 |
| `playBarsSound(pitch)` | 206-218 | triangle + sine 1.5× + noise highpass 5000 |
| `playTone(freq,type,dur,vol)` | 221-253 | oscilador genérico (el que usan QuickSort y Queens) |

`croak()` (`:62-110`) es lo más elaborado: sierra + AM a 48 Hz + **dos formantes bandpass**
(550 Hz Q4 y 1700 Hz Q6) para aproximar un croar real.

### 8.2 Audio propio embebido

- **`SaltoRanaPanel.tsx:59`**: `SONIDO_DE_CROAR_BASE64` es un **Data URI de 22 965 caracteres**
  (`data:audio/mpeg;base64,…`) con un MP3 real. Se instancia con `new Audio(...)` (`:246-254`),
  `volume = 0.85`, y se reinicia con `audio.currentTime = 0` (`:261`) para permitir superponer croares.
  El aterrizaje se sintetiza aparte: ruido blanco con `BiquadFilter lowpass 700 Hz` y gain
  0.28→0.001 (`:268-291`).
- **`HanoiPanel.tsx:174-204`**: `playDiscSound` crea **su propio `AudioContext`** (oscillator
  `triangle` 260→90 Hz, gain 0.12→0.001 en 50 ms) — no usa `useSoundEffects`.

### 8.3 Sincronización de sonido con CSS

`RecursiveMenuPanel.tsx` implementa `useTimedEvents(active, period, events)` (`:16-35`) para alinear
eventos de audio con animaciones CSS puras: `FrogIcon` con ciclo 3200 ms y eventos en 280/1310/2910
ms (`:184-188`); `QueenIcon` con ciclo 4800 ms y eventos en `220 + d*1000` ms (`:248-252`).

---

## 9. Hallazgos, defectos y deuda técnica

### 9.1 Backend

| # | Severidad | Hallazgo | Ubicación |
|---|---|---|---|
| 1 | **Alta** | **No thread-safe**: `TorresHanoiServicio.indice` y `SaltoRanaServicio.movimientos`/`cantidadMovimientos` son campos mutables de beans `@Service` singleton sin `synchronized` ni `ThreadLocal`. Peticiones concurrentes se corrompen (`ArrayIndexOutOfBoundsException` o trazas mezcladas). | `TorresHanoiServicio.java:10`, `SaltoRanaServicio.java:16-17` |
| 2 | Alta | **8 Reinas no calcula nada**: la solución es la constante `SOLUCION`. Los endpoints `POST\|GET /api/recursive/eight-queens` (con `QueenStepDto`, notación algebraica y verificación) **existen pero el frontend nunca los llama**. | `OchoReinasService.java:27`, `QueensPanelV2.tsx:11` |
| 3 | Media | `@RequestMapping("/api/")` con barra final → registra `/api//recursive/...`. Funciona por normalización de Spring, pero es frágil. | `QuickSortController.java:22`, `OchoReinasController.java:20` |
| 4 | Media | `IllegalArgumentException` por discos fuera de rango en lugar de 4xx → **HTTP 500** en vez de 400. Sin `@ControllerAdvice`. | `HanoiController.java:21-23` |
| 5 | Media | `PUT /api/recursive/eight-queens` es un **stub** que no reinicia nada. | `OchoReinasController.java:77-83` |
| 6 | Baja | Caso base `n == 1` sin `n == 0`: depende enteramente de la validación del controller. | `TorresHanoiServicio.java:25` |
| 7 | Baja | `QuickSortService.quickSort(int[])` construye y descarta la traza completa; no lo invoca nadie. | `QuickSortService.java:75-78` |
| 8 | Baja | `verifyMatrixRecursive` + los DTO `QueenPositionDto` y `MoveQueenDto` son **código muerto** (solo los usa el test). | `OchoReinasService.java:123-142` |
| 9 | Baja | `estadoInicial` reconstruido duplicando lógica del servicio, en el controller. | `SaltoRanaController.java:40` |
| 10 | Baja | Torres de Hanoi: A/B/C **hardcodeados**, no parametrizables por la API. | `TorresHanoiServicio.java:20` |
| 11 | Info | `package-lock.json` **vacío** (0 paquetes) sin `package.json` — residuo de un `npm install` sin manifiesto. | `Backend/package-lock.json` |
| 12 | Info | `pom.xml` declara `artifactId=AEDLab1` y el paquete raíz es `uni.AEDLab1`, pero el proyecto es un lab 4. | `pom.xml:12` |
| 13 | Info | Solo hay un test real (`OchoReinasServiceTest`); QuickSort, Hanoi y SaltoRana **no tienen cobertura**. | `src/test/java/` |

### 9.2 Frontend

| # | Severidad | Hallazgo | Ubicación |
|---|---|---|---|
| 1 | **Alta** | **Falso positivo de verificación**: si el backend está caído, `QueensPanelV2` marca `isVerified = true` igualmente. | `QueensPanelV2.tsx:151-153` |
| 2 | **Alta** | **Código muerto del Lab 1/2**: `GenericSortingPanel.tsx`, `CommonComponents.tsx` y `services/algorithmService.ts` (55 l.) apuntan a `/api/algoritmo/*` — **3 endpoints que no existen** → 404. No son alcanzables desde `App.tsx`. | `algorithmService.ts:1,16,30,44` |
| 3 | Media | **Sin pausa / sin paso / sin velocidad en QuickSort**, el panel más complejo: los tiempos están hardcodeados por `action`. | `QuickSortPanel.tsx:195-217` |
| 4 | Media | `SaltoRanaPanel` carga la solución **una sola vez al montar** con `deps []` y siempre `ranasPorLado=3`; no hay forma de re-resolver. | `SaltoRanaPanel.tsx:31,294-311` |
| 5 | Media | **URL base hardcodeada** (`API_KEY`, dos `BASE_URL`); no hay `.env` ni `import.meta.env`. El proxy de Vite está declarado pero es inefectivo. | `HTTPMethods.tsx:9`, `saltoRanaService.ts:1`, `vite.config.ts:9-11` |
| 6 | Media | `SaltoRanaPanel` **descarta** `estadoInicial`, `estadoFinal` y `totalMovimientos` de la respuesta. | `SaltoRanaPanel.tsx:299` |
| 7 | Media | `package-lock.json` **desincronizado**: `framer-motion` está en `package.json` pero ausente del lock. | `package.json:14` |
| 8 | Baja | `App.css` (184 líneas de la plantilla Vite) **nunca se importa**. | `src/App.css` |
| 9 | Baja | `index.html:7`: `<title>mi-proyecto</title>` — nunca cambiado. `package.json:2` `name: "mi-proyecto"`. | `index.html:7` |
| 10 | Baja | `tsconfig.app.json:25` incluye `src/SortingMethodsPanel.tsx` y `src/BubbleSortPanel.tsx`, que **no existen**. | `tsconfig.app.json:25` |
| 11 | Baja | 8 de 11 assets **sin usar**: `hero.png`, `Quick Sort.png`, `Reinas.png`, `Salto de la Rana.png`, `Torre de Hanoi.png`, `Ranita.mp3`, `react.svg`, `vite.svg`. | `src/assets/` |
| 12 | Baja | `fetchRequest` (alias de `apiRequest`) nunca usado; `BiquadFilter` mal escrito (debería ser `BiquadFilterNode`). | `HTTPMethods.tsx:63`, `SaltoRanaPanel.tsx:280` |
| 13 | Baja | `README.md` raíz con una sola línea (`# aed-lab-1`); el `README.md` del Frontend es la plantilla de Vite. | raíz y `Frontend/` |
| 14 | Info | Sin React Router: no hay URLs, history, deep-linking ni botón "atrás" del navegador. | `App.tsx:11-18` |
| 15 | Info | Sin tests en el frontend. | — |
| 16 | Info | Accesibilidad: `RecursiveMenuPanel` es el único con `prefers-reduced-motion` (`:673-675`). El resto no lo contempla. | `RecursiveMenuPanel.tsx:673-675` |

---

## 10. Conclusión

La aplicación es un **laboratorio de algoritmos recursivos visualizados**, con una separación
clara entre *motor de cálculo* y *reproductor visual*:

- **El backend es un motor de trazas.** No devuelve resultados: devuelve **líneas de tiempo**. Cada
  servicio instrumenta su algoritmo registrando un frame en los puntos semánticamente importantes
  (`addStep` en QuickSort, `pasos[indice++]` en Hanoi, `movimientos[n++] = ...` en Rana,
  `steps.add(...)` en Reinas) y con **clonado profundo del estado en cada frame**, lo que permite al
  frontend hacer *time-travel*.

- **La recursión se manifiesta de cuatro maneras distintas**, y esa diversidad es lo que hace
  interesante al proyecto:
  1. **Hanoi** la usa para *generar la secuencia*: cada llamada baja un nivel, emite un movimiento y
     retorna; la profundidad **es** el número de disco.
  2. **QuickSort** la usa para *dividir*: el corte de Hoare en `right` garantiza rangos disjuntos y
     terminación, y la profundidad se ve en `range`, que el frontend usa para atenuar (`opacity-30
     grayscale`) lo que está fuera del subarreglo activo.
  3. **Salto de la Rana** la usa para *explorar y retroceder*: `intentarResolverDesde` devuelve
     `boolean` y cada nivel que falla **deshace su propio movimiento** (`cantidadMovimientos--` +
     swap inverso), de modo que la traza devuelta contiene exactamente la solución, sin los caminos
     muertos.
  4. **8 Reinas** la usa solo para *verificar* (descenso lineal cortocircuitado), porque la
     solución está hardcodeada.

- **El frontend es un reproductor heterogéneo**: cada panel eligió un motor distinto según lo que
  necesitaba — `setInterval` + Framer Motion con keyframes (Hanoi), `requestAnimationFrame` con
  easing y parábola (Rana), bucle `async/await` con `delay` por discriminante y cancelación cooperativa
  (QuickSort), y avance manual por pasos (Reinas).

Los puntos débiles principales son la **ausencia de thread-safety** en dos servicios (por el uso de
campos de instancia mutables en beans singleton), la **solución de 8 Reinas hardcodeada en ambos
extremos** (que deja sin uso la API de trazas que el propio backend implementa), el **código muerto
del Lab 1/2** que apunta a endpoints inexistentes, y la **falsa verificación** del panel de reinas
cuando el backend no responde.
