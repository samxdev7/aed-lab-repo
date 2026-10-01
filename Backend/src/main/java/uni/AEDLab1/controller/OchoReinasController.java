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
    
    private final OchoReinasService servicio;

    public OchoReinasController(OchoReinasService servicio) {
        this.servicio = servicio;
    }
    
    /**
     * Endpoint POST: /api/recursive/eight-queens
     * Genera y retorna la traza paso a paso de la combinación fija de 8 reinas,
     * verificando recursivamente cada inserción en Java para que el Frontend la anime.
     * 
     * @return EightQueensResponseDto con la matriz de solución y los 8 pasos verificados recursivamente.
     */
    @PostMapping("/recursive/eight-queens")
    public ResponseEntity<EightQueensResponseDto> obtenerSolucionOchoReinas() {
        EightQueensResponseDto respuesta = this.servicio.resolverConTrazaRecursiva();
        return new ResponseEntity<>(respuesta, HttpStatusCode.valueOf(200));
    }

    /**
     * Endpoint GET: /api/recursive/eight-queens
     * Permite consultar la solución y los pasos de verificación recursiva.
     */
    @GetMapping("/recursive/eight-queens")
    public ResponseEntity<EightQueensResponseDto> obtenerSolucionOchoReinasGet() {
        EightQueensResponseDto respuesta = this.servicio.resolverConTrazaRecursiva();
        return new ResponseEntity<>(respuesta, HttpStatusCode.valueOf(200));
    }

    /**
     * Endpoint POST: /api/recursive/eight-queens/verify
     * Ejecuta la verificación recursiva completa de las ocho reinas en el tablero 8x8.
     */
    @PostMapping("/recursive/eight-queens/verify")
    public ResponseEntity<?> ejecutarVerificacionOchoReinas() {
        boolean esValido = this.servicio.verificarTodoRecursivo(OchoReinasService.SOLUCION, OchoReinasService.TAMANO);
        
        Map<String, Object> cuerpo = new HashMap<>();
        cuerpo.put("valid", esValido);
        cuerpo.put("solution", this.servicio.obtenerMatrizSolucion());
        
        if (!esValido) {
            cuerpo.put("message", "Error: Se detectaron amenazas entre reinas.");
            return new ResponseEntity<>(cuerpo, HttpStatusCode.valueOf(400));
        }
        
        cuerpo.put("message", "Verificación recursiva exitosa: Las ocho reinas colocadas no se amenazan entre sí.");
        return new ResponseEntity<>(cuerpo, HttpStatusCode.valueOf(200));
    }

    /**
     * Endpoint PUT: /api/recursive/eight-queens
     * Notifica el reinicio del tablero en el cliente.
     */
    @PutMapping("/recursive/eight-queens")
    public ResponseEntity<?> reiniciarReinas() {
        Map<String, Object> cuerpo = new HashMap<>();
        cuerpo.put("message", "El tablero de 8 reinas se reinició correctamente.");
        cuerpo.put("queens", new int[0][0]);
        return new ResponseEntity<>(cuerpo, HttpStatusCode.valueOf(200));
    }
}
