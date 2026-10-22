package uni.AEDLab1.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import uni.AEDLab1.models.PilaEstadoDto;
import uni.AEDLab1.models.PilaPeticionDto;
import uni.AEDLab1.models.PilaTamanoPeticionDto;
import uni.AEDLab1.services.PilaServicio;

import java.util.Map;

@RestController
@RequestMapping("/api/pila")
public class PilaController {

    private final PilaServicio pilaServicio;

    public PilaController(PilaServicio pilaServicio) {
        this.pilaServicio = pilaServicio;
    }

    @GetMapping("/estado")
    public ResponseEntity<PilaEstadoDto> obtenerEstado() {
        return ResponseEntity.ok(pilaServicio.obtenerEstado());
    }

    @PostMapping("/tamano")
    public ResponseEntity<?> definirTamano(@RequestBody PilaTamanoPeticionDto peticion) {
        try {
            return ResponseEntity.ok(pilaServicio.definirTamano(peticion.max()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/push")
    public ResponseEntity<?> push(@RequestBody PilaPeticionDto peticion) {
        try {
            return ResponseEntity.ok(pilaServicio.push(peticion.centroComercial()));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/pop")
    public ResponseEntity<?> pop() {
        try {
            return ResponseEntity.ok(pilaServicio.pop());
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}