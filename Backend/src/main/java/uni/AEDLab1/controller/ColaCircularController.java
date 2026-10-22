package uni.AEDLab1.controller;

import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import uni.AEDLab1.models.ColaCircularEstadoDto;
import uni.AEDLab1.models.ColaCircularPeticionDto;
import uni.AEDLab1.services.ColaCircularServicio;

@RestController
@RequestMapping("/api/cola-circular")
public class ColaCircularController {

    private final ColaCircularServicio colaCircularServicio;

    public ColaCircularController(ColaCircularServicio colaCircularServicio) {
        this.colaCircularServicio = colaCircularServicio;
    }

    @GetMapping("/estado")
    public ResponseEntity<ColaCircularEstadoDto> obtenerEstado() {
        return new ResponseEntity<>(colaCircularServicio.obtenerEstado(), HttpStatusCode.valueOf(200));
    }

    @PostMapping("/encolar")
    public ResponseEntity<?> encolar(@jakarta.validation.Valid @RequestBody ColaCircularPeticionDto peticion) {
        if (peticion == null) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", "Error: Cuerpo de la petición no proporcionado."));
        }
        ColaCircularEstadoDto estado = colaCircularServicio.encolar(peticion.estacion());
        return ResponseEntity.ok(estado);
    }

    @DeleteMapping("/desencolar")
    public ResponseEntity<ColaCircularEstadoDto> desencolar() {
        return ResponseEntity.ok(colaCircularServicio.desencolar());
    }

    @PostMapping("/reiniciar")
    public ResponseEntity<ColaCircularEstadoDto> reiniciar() {
        return new ResponseEntity<>(colaCircularServicio.reiniciar(), HttpStatusCode.valueOf(200));
    }
}
