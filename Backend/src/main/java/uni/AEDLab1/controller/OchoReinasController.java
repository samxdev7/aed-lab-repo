package uni.AEDLab1.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
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
        boolean response = this.service.addQueen(queen.x(), queen.y());
        if (!response) {
            return new ResponseEntity<>(this.service.getQueens(), HttpStatusCode.valueOf(400));
        }
        
        return new ResponseEntity<>(this.service.getQueens(), HttpStatusCode.valueOf(201));
    }
    
    /**
     * Endpoint PATCH: /recursive/eight-queens
     * Consume la posicion actual de la reina y la nueva posicion en que estara para moverla.
     */
    @PatchMapping("/recursive/eight-queens")
    public ResponseEntity<?> moveQueen(
        @Valid
        @NotNull(message = "Error: Datos de entrada nulos.")
        @RequestBody 
        MoveQueenDto queenPosData) 
    {
        boolean response = this.service.moveQueen(queenPosData.x1(), queenPosData.y1(),
            queenPosData.x2(), queenPosData.y2());
        
        if (!response) {
            return new ResponseEntity<>("Error: No se puede colocar una reina en la posición donde otra reina la ocupe.", HttpStatusCode.valueOf(400));
        }
        
        return new ResponseEntity<>(this.service.getQueens(), HttpStatusCode.valueOf(200));
    }

    /**
     * Endpoint POST: /recursive/eight-queens/verify
     * Verifica si las ocho reinas que fueron colocadas en el tablero no se amenazan mutuamento,
     * tal caso se toma como verdadero.
     */
    @PostMapping("/recursive/eight-queens/verify")
    public ResponseEntity<?> executeEightQueensVerification() {
        boolean response = this.service.executeVerification();
        return new ResponseEntity<>(response, HttpStatusCode.valueOf(200));
    }
    
    /**
     * Endpoint PUT: /recursive/eight-queens
     * Limpia el registro de las reinas ingresadas en el tablero.
     */
    @PutMapping("/recursive/eight-queens")
    public ResponseEntity<?> cleanQueensRegister() {
        boolean response = this.service.resetQueenRegister();
        return new ResponseEntity<>(response, HttpStatusCode.valueOf(200));
    }
}
