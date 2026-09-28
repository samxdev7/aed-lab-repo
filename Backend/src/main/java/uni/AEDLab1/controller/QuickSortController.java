package uni.AEDLab1.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.util.HashMap;
import java.util.Map;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import uni.AEDLab1.models.QuickSortArrayDto;
import uni.AEDLab1.services.QuickSortService;

/**
 * Controlador REST para gestionar los algoritmos recursivos del algoritmo QuickSort.
 * Expone los endpoints para interactuar con el arreglo y el algoritmo recursivo mismo.
 * 
 * @author samxdev7
 * @version 1.0
 */
@RestController
@RequestMapping("/api/")
public class QuickSortController {
    
    // Instancia en memoria del servicio para el Laboratorio 3
    private QuickSortService service = new QuickSortService();
   
    /**
     *  Endpoint POST: /recursive/quicksort
     *  Ordena a traves de quicksort el arreglo solicitado desde el Frontend.
     */
    @PostMapping("/recursive/quicksort")
    public ResponseEntity<?> executeQuickSort(@RequestBody QuickSortArrayDto data) {
        Map<String, Object> body = new HashMap<>();
        int[] response = this.service.quickSort(data.array());
        
        body.put("response", response);
        
        if (response == null) {
            body.put("message", "El arreglo no se ordenó correctamente. Debe tener 10 elementos obligatoriamente.");
            return new ResponseEntity<>(body, HttpStatusCode.valueOf(400));
        }
        
        body.put("message", "Arreglo ordenado.");
        return new ResponseEntity<>(response, HttpStatusCode.valueOf(200));
    }
}
