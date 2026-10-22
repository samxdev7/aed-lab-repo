package uni.AEDLab1.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import uni.AEDLab1.models.ColaEstadoDto;
import uni.AEDLab1.models.ColaPeticionDto;
import uni.AEDLab1.services.ColaServicio;

import java.util.Map;

@RestController
@RequestMapping("/api/cola")
public class ColaController {

    private final ColaServicio colaServicio;

    public ColaController(ColaServicio colaServicio) {
        this.colaServicio = colaServicio;
    }

    @GetMapping("/estado")
    public ColaEstadoDto obtenerEstado() {
        return colaServicio.obtenerEstado();
    }

    @PostMapping("/encolar")
    public ColaEstadoDto encolar(@jakarta.validation.Valid @RequestBody ColaPeticionDto peticion) {
        return colaServicio.encolar(peticion.persona());
    }

    @DeleteMapping("/desencolar")
    public ColaEstadoDto desencolar() {
        return colaServicio.desencolar();
    }

    @PostMapping("/reiniciar")
    public ColaEstadoDto reiniciar() {
        return colaServicio.reiniciar();
    }

    // Desbordamiento, subdesbordamiento o nombre inválido -> 400 con { "message": "..." }
    @ExceptionHandler({IllegalArgumentException.class, IllegalStateException.class})
    public ResponseEntity<Map<String, String>> manejarErrorDeCola(RuntimeException error) {
        return ResponseEntity.badRequest().body(Map.of("message", error.getMessage()));
    }
}