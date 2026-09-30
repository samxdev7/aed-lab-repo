package uni.AEDLab1.controller;

import java.util.HashMap;
import java.util.Map;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import uni.AEDLab1.models.EightQueensResponseDto;
import uni.AEDLab1.services.OchoReinasService;

/**
 * Controlador REST para el problema de las ocho reinas en un tablero 8x8.
 * Expone los endpoints para obtener la traza de pasos verificada recursivamente
 * y validar la combinación establecida.
 * 
 * @author samxdev7
 * @version 2.0
 */
@RestController
@RequestMapping("/api/")
public class OchoReinasController {
    
    private final OchoReinasService service;

    public OchoReinasController(OchoReinasService service) {
        this.service = service;
    }
    
    /**
     * Endpoint POST: /api/recursive/eight-queens
     * Genera y retorna la traza paso a paso de la combinación fija de 8 reinas,
     * verificando recursivamente cada inserción en Java para que el Frontend la anime.
     * 
     * @return EightQueensResponseDto con la matriz de solución y los 8 pasos verificados recursivamente.
     */
    @PostMapping("/recursive/eight-queens")
    public ResponseEntity<EightQueensResponseDto> getEightQueensSolution() {
        EightQueensResponseDto response = this.service.solveWithRecursiveTrace();
        return new ResponseEntity<>(response, HttpStatusCode.valueOf(200));
    }

    /**
     * Endpoint GET: /api/recursive/eight-queens
     * Permite consultar la solución y los pasos de verificación recursiva.
     */
    @GetMapping("/recursive/eight-queens")
    public ResponseEntity<EightQueensResponseDto> getEightQueensSolutionGet() {
        EightQueensResponseDto response = this.service.solveWithRecursiveTrace();
        return new ResponseEntity<>(response, HttpStatusCode.valueOf(200));
    }

    /**
     * Endpoint POST: /api/recursive/eight-queens/verify
     * Ejecuta la verificación recursiva completa de las ocho reinas en el tablero 8x8.
     */
    @PostMapping("/recursive/eight-queens/verify")
    public ResponseEntity<?> executeEightQueensVerification() {
        boolean valid = this.service.verifyAllRecursive(OchoReinasService.SOLUCION, OchoReinasService.TAMANO);
        
        Map<String, Object> body = new HashMap<>();
        body.put("valid", valid);
        body.put("solution", this.service.getSolutionMatrix());
        
        if (!valid) {
            body.put("message", "Error: Se detectaron amenazas entre reinas.");
            return new ResponseEntity<>(body, HttpStatusCode.valueOf(400));
        }
        
        body.put("message", "Verificación recursiva exitosa: Las ocho reinas colocadas no se amenazan entre sí.");
        return new ResponseEntity<>(body, HttpStatusCode.valueOf(200));
    }

    /**
     * Endpoint PUT: /api/recursive/eight-queens
     * Notifica el reinicio del tablero en el cliente.
     */
    @PutMapping("/recursive/eight-queens")
    public ResponseEntity<?> resetQueens() {
        Map<String, Object> body = new HashMap<>();
        body.put("message", "El tablero de 8 reinas se reinició correctamente.");
        body.put("queens", new int[0][0]);
        return new ResponseEntity<>(body, HttpStatusCode.valueOf(200));
    }
}
