package uni.AEDLab1.controller;

import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import uni.AEDLab1.models.BusquedaBinariaDto;
import uni.AEDLab1.models.OrdenamientoDto;
import uni.AEDLab1.services.BusquedaBinariaServicio;
import uni.AEDLab1.services.OrdenamientoServicio;
import uni.AEDLab1.services.BusquedaBinariaServicio.ResultadoBusqueda;

/**
 * Controlador REST para gestionar los algoritmos de ordenamiento y de búsqueda binaria.
 * Expone los endpoints para interactuar con el arreglo desordenado de clientes.
 */
@RestController
@RequestMapping("/api/")
public class AlgoritmoController {
    
    // Instancia en memoria del servicio para el Laboratorio 2
    private OrdenamientoServicio servicioOrdenamiento = new OrdenamientoServicio();
    private BusquedaBinariaServicio servicioBusquedaBinaria = new BusquedaBinariaServicio();
    
    /**
     * Endpoint POST: /algoritmo/ordenamiento
     * Ordena un arreglo como entrada y el método de ordenación seleccionado, 
     * una vez ordenado se devuelve.
     */
    @PostMapping("/algoritmo/ordenamiento")
    public ResponseEntity<?> ordenarArreglo(@RequestBody OrdenamientoDto datos) {
        if (datos == null || datos.arreglo() == null) {
            return new ResponseEntity<>("Error: Datos de entrada nulos o inválidos.", HttpStatusCode.valueOf(400));
        }

        int[] arregloOrdenado = servicioOrdenamiento.ejecutar(datos);
        
        // Si no se ordena el arreglo correctamente o se selecciona un método inválido, retorna null
        if (arregloOrdenado == null) {
            return new ResponseEntity<>("Error: No se ordenó el arreglo con alguno de los métodos de ordenación.", HttpStatusCode.valueOf(400));
        }
        
        return new ResponseEntity<>(arregloOrdenado, HttpStatusCode.valueOf(201));
    }
    
    /**
     * Endpoint POST: /algoritmo/busqueda
     * Consume el elemento a encontrar y el arreglo, se devuelve el indice del elemento encontrado.
     */
    @PostMapping("/algoritmo/busqueda")
    public ResponseEntity<?> buscarElemento(@RequestBody BusquedaBinariaDto datos) {
        if (datos == null || datos.arreglo() == null) {
            return new ResponseEntity<>("Error: Datos de entrada nulos o inválidos.", HttpStatusCode.valueOf(400));
        }

        // Se específica el método de ordenación "Shell" por su rapidez (opción 6)

        OrdenamientoDto arregloOriginal = new OrdenamientoDto(datos.tam(), datos.arreglo(), 6);
        
        int[] arregloOrdenado = servicioOrdenamiento.ejecutar(arregloOriginal);
        if (arregloOrdenado == null) {
            return new ResponseEntity<>("Error: No se ordenó el arreglo con alguno de los métodos de ordenación.", HttpStatusCode.valueOf(400));
        }
        
        // Luego se crea un nuevo DTO para la ejecución de servicio de Busqueda Binaria para el 
        // arreglo ya ordenado.
        BusquedaBinariaDto busquedaArregloOrdenado = new BusquedaBinariaDto(
            datos.tam(), arregloOrdenado, datos.objetivo());
        
        int indiceElementoEncontrado = servicioBusquedaBinaria.buscarElemento(busquedaArregloOrdenado);
        
        // Si no encuentra el elemento solicitado, devuelve -1
        if (indiceElementoEncontrado == -1) {
            return new ResponseEntity<>("Error: No se encontró el elemento " + datos.objetivo() + " dentro del arreglo.", HttpStatusCode.valueOf(400));
        }
        
        ResultadoBusqueda res = new ResultadoBusqueda(arregloOrdenado, indiceElementoEncontrado);
        return new ResponseEntity<>(res, HttpStatusCode.valueOf(201));
    }

    /**
     * Endpoint POST: /algoritmo/tamano
     * Guarda el tamaño del arreglo y devuelve un mensaje de confirmación.
     */
    @PostMapping("/algoritmo/tamano")
    public ResponseEntity<?> guardarTamano(@RequestBody java.util.Map<String, Integer> payload) {
        Integer tamano = payload.get("tamano");
        if (tamano == null || tamano <= 0) {
            return new ResponseEntity<>(java.util.Map.of("message", "Error: Tamaño de arreglo inválido"), HttpStatusCode.valueOf(400));
        }
        
        OrdenamientoServicio.setTamanoGuardado(tamano);
        return new ResponseEntity<>(java.util.Map.of("message", "El tamaño del arreglo (" + tamano + " elementos) ha sido guardado exitosamente.", "tamano", tamano), HttpStatusCode.valueOf(200));
    }

}
