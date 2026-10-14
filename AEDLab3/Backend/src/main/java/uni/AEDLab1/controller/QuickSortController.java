package uni.AEDLab1.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.util.HashMap;
import java.util.Map;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import uni.AEDLab1.models.QuickSortArrayDto;
import uni.AEDLab1.models.QuickSortResponseDto;
import uni.AEDLab1.services.QuickSortService;

/**
 * Controlador REST para gestionar el algoritmo recursivo QuickSort (esquema Hoare).
 * Expone los endpoints para ordenar el arreglo y retornar la traza de animación.
 * 
 * @author samxdev7
 * @version 2.0
 */
@RestController
@RequestMapping("/api/")
public class QuickSortController {
    
    private final QuickSortService servicio;
    
    public QuickSortController(QuickSortService servicio) {
        this.servicio = servicio;
    }
   
    /**
     * Endpoint POST: /recursive/quicksort
     * Ordena mediante QuickSort (esquema Hoare) y retorna la traza paso a paso para la animación en Frontend.
     * 
     * @param datos DTO con el arreglo de 10 elementos.
     * @return QuickSortResponseDto con el arreglo ordenado, los pasos de animación y el mensaje.
     */
    @PostMapping("/recursive/quicksort")
    public ResponseEntity<?> ejecutarQuickSort(
        @Valid
        @NotNull(message = "El cuerpo de la petición no puede ser nulo.")
        @RequestBody 
        QuickSortArrayDto datos
    ) {
        if (datos == null || datos.arreglo() == null) {
            Map<String, Object> cuerpoError = new HashMap<>();
            cuerpoError.put("message", "Error: Los datos de entrada no pueden ser nulos.");
            return new ResponseEntity<>(cuerpoError, HttpStatusCode.valueOf(400));
        }

        if (this.servicio.tieneDuplicados(datos.arreglo())) {
            Map<String, Object> cuerpoError = new HashMap<>();
            cuerpoError.put("message", "Error: El arreglo no debe contener elementos duplicados.");
            return new ResponseEntity<>(cuerpoError, HttpStatusCode.valueOf(400));
        }

        QuickSortResponseDto respuesta = this.servicio.ejecutarQuickSort(datos.arreglo());
        
        if (respuesta == null) {
            Map<String, Object> cuerpoError = new HashMap<>();
            cuerpoError.put("message", "El arreglo no se ordenó correctamente. Debe tener 10 elementos obligatoriamente.");
            return new ResponseEntity<>(cuerpoError, HttpStatusCode.valueOf(400));
        }
        
        return new ResponseEntity<>(respuesta, HttpStatusCode.valueOf(200));
    }
}
