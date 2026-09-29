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
    
    private final QuickSortService service;
    
    public QuickSortController(QuickSortService service) {
        this.service = service;
    }
   
    /**
     * Endpoint POST: /recursive/quicksort
     * Ordena mediante QuickSort (esquema Hoare) y retorna la traza paso a paso para la animación en Frontend.
     * 
     * @param data DTO con el arreglo de 10 elementos.
     * @return QuickSortResponseDto con el arreglo ordenado, los pasos de animación y el mensaje.
     */
    @PostMapping("/recursive/quicksort")
    public ResponseEntity<?> executeQuickSort(
        @Valid
        @NotNull(message = "El cuerpo de la petición no puede ser nulo.")
        @RequestBody 
        QuickSortArrayDto data
    ) {
        if (data == null || data.array() == null) {
            Map<String, Object> errorBody = new HashMap<>();
            errorBody.put("message", "Error: Los datos de entrada no pueden ser nulos.");
            return new ResponseEntity<>(errorBody, HttpStatusCode.valueOf(400));
        }

        if (this.service.hasDuplicates(data.array())) {
            Map<String, Object> errorBody = new HashMap<>();
            errorBody.put("message", "Error: El arreglo no debe contener elementos duplicados.");
            return new ResponseEntity<>(errorBody, HttpStatusCode.valueOf(400));
        }

        QuickSortResponseDto response = this.service.executeQuickSort(data.array());
        
        if (response == null) {
            Map<String, Object> errorBody = new HashMap<>();
            errorBody.put("message", "El arreglo no se ordenó correctamente. Debe tener 10 elementos obligatoriamente.");
            return new ResponseEntity<>(errorBody, HttpStatusCode.valueOf(400));
        }
        
        return new ResponseEntity<>(response, HttpStatusCode.valueOf(200));
    }
}
