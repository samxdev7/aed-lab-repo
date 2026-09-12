package uni.AEDLab1.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.util.HashMap;
import java.util.Map;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import uni.AEDLab1.models.MoveQueenDto;
import uni.AEDLab1.models.QueenPositionDto;
import uni.AEDLab1.services.OchoReinasService;

/**
 * Controlador REST para gestionar los algoritmos recursivos del problema de las ocho reinas.
 * Expone los endpoints para interactuar con el tablero de ajedrez (un arreglo bidimensional 8x8).
 * 
 * @author samxdev7
 * @version 1.0
 */
@RestController
@RequestMapping("/api/")
public class OchoReinasController {
    
    // Instancia en memoria del servicio para el Laboratorio 3
    private OchoReinasService service = new OchoReinasService();
    
    /**
     * Endpoint POST: /recursive/eight-queens
     * Ordena un arreglo como entrada y el método de ordenación seleccionado, 
     * una vez ordenado se devuelve.
     */
    @PostMapping("/recursive/eight-queens")
    public ResponseEntity<?> addQueenRequest(
        @Valid
        @NotNull(message = "Error: Datos de entrada nulos.")
        @RequestBody 
        QueenPositionDto queen) 
    {
        Map<String, Object> body = new HashMap<>();
        
        boolean response = this.service.agregarReina(queen.x(), queen.y());        
        body.put("response", response);
        body.put("queens", this.service.getQueens());
        
        if (!response) {
            body.put("message", "Error: No se puede colocar una reina en una posicion donde otra reina ya lo ocupe.");
            return new ResponseEntity<>(body, HttpStatusCode.valueOf(400));
        }
        
        body.put("message", "Reina colcada con exito en la posición (" + queen.x() + ", " + queen.y() + ").");
        return new ResponseEntity<>(body, HttpStatusCode.valueOf(201));
    }
    
    /**
     * Endpoint PATCH: /recursive/eight-queens
     * Consume la posicion actual de la reina y la nueva posicion en que estara para moverla.
     */
    @PatchMapping("/recursive/eight-queens")
    public ResponseEntity<?> moverReina(
        @Valid
        @NotNull(message = "Error: Datos de entrada nulos.")
        @RequestBody 
        MoveQueenDto queenPosData) 
    {
        Map<String, Object> body = new HashMap<>();
        
        boolean response = this.service.moverReina(queenPosData.x1(), queenPosData.y1(),
            queenPosData.x2(), queenPosData.y2());
        body.put("response", response);
        body.put("queens", this.service.getQueens());
        
        if (!response) {
            body.put("message", "Error: No se puede colocar una reina en una posicion donde otra reina ya lo ocupe.");
            return new ResponseEntity<>(body, HttpStatusCode.valueOf(400));
        }
        
        body.put("message", "Reina colcada con exito en la posición (" + queenPosData.x2() + ", " + queenPosData.y2() + ").");
        return new ResponseEntity<>(body, HttpStatusCode.valueOf(200));
    }
    
    /**
     * Endpoint PUT: /recursive/eight-queens
     * Limpia el registro de las reinas ingresadas en el tablero.
     */
    @PutMapping("/recursive/eight-queens")
    public ResponseEntity<?> cleanQueensRegister() {
        Map<String, Object> body = new HashMap<>();
        boolean response = this.service.reiniciarRegistroDeReinas();
        
        body.put("response", response);
        body.put("queens", this.service.getQueens());
        body.put("message", "El tablero se limpio correctamente.");
        
        return new ResponseEntity<>(body, HttpStatusCode.valueOf(200));
    }

    /**
     * Endpoint POST: /recursive/eight-queens/verify
     * Verifica si las ocho reinas que fueron colocadas en el tablero no se amenazan mutuamento,
     * tal caso se toma como verdadero.
     */
    @PostMapping("/recursive/eight-queens/verify")
    public ResponseEntity<?> executeEightQueensVerification() {
        Map<String, Object> body = new HashMap<>();
        boolean response = this.service.ejecutarVerificacion();
        
        body.put("response", response);
        body.put("queens", this.service.getQueens());
        
        if (!response) {
            body.put("message", "Hay reinas que se amenazan entre si o no hay 8 reinas en total.");
            return new ResponseEntity<>(body, HttpStatusCode.valueOf(400));
        }
        
        body.put("message", "Las ocho reinas colocadas en el tablero no se amenazan entre si.");
        return new ResponseEntity<>(response, HttpStatusCode.valueOf(200));
    }
}
