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
    public ResponseEntity<?> encolar(@RequestBody ColaCircularPeticionDto peticion) {
        try {
            if (peticion == null) {
                return new ResponseEntity<>("Error: Cuerpo de la petición no proporcionado.", HttpStatusCode.valueOf(400));
            }
            ColaCircularEstadoDto estado = colaCircularServicio.encolar(peticion.estacion());
            return new ResponseEntity<>(estado, HttpStatusCode.valueOf(200));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatusCode.valueOf(400));
        } catch (Exception e) {
            return new ResponseEntity<>("Error interno: " + e.getMessage(), HttpStatusCode.valueOf(500));
        }
    }

    @DeleteMapping("/desencolar")
    public ResponseEntity<?> desencolar() {
        try {
            ColaCircularEstadoDto estado = colaCircularServicio.desencolar();
            return new ResponseEntity<>(estado, HttpStatusCode.valueOf(200));
        } catch (IllegalStateException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatusCode.valueOf(400));
        } catch (Exception e) {
            return new ResponseEntity<>("Error interno: " + e.getMessage(), HttpStatusCode.valueOf(500));
        }
    }

    @PostMapping("/reiniciar")
    public ResponseEntity<ColaCircularEstadoDto> reiniciar() {
        return new ResponseEntity<>(colaCircularServicio.reiniciar(), HttpStatusCode.valueOf(200));
    }
}
