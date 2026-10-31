package uni.AEDLab1.controller;

import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import uni.AEDLab1.models.ArbolesRespuestaDto;
import uni.AEDLab1.services.ArbolesServicio;
import jakarta.validation.Valid;
import uni.AEDLab1.models.ConfirmarHijoDto;
import uni.AEDLab1.models.IniciarArbolDto;
import uni.AEDLab1.models.ResponderPreguntaDto;

@RestController
@RequestMapping("/api/arboles")
@CrossOrigin(originPatterns = "*", allowedHeaders = "*", allowCredentials = "true")
public class ArbolesController {

    private final ArbolesServicio arbolesServicio;

    public ArbolesController(ArbolesServicio arbolesServicio) {
        this.arbolesServicio = arbolesServicio;
    }

    @PostMapping("/iniciar")
    public ResponseEntity<?> iniciar(@Valid @RequestBody IniciarArbolDto dto) {
        try {
            ArbolesRespuestaDto respuesta = arbolesServicio.iniciarArbol(dto.valor());
            return new ResponseEntity<>(respuesta, HttpStatusCode.valueOf(200));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return new ResponseEntity<>("Error: " + e.getMessage(), HttpStatusCode.valueOf(400));
        } catch (Exception e) {
            return new ResponseEntity<>("Error interno: " + e.getMessage(), HttpStatusCode.valueOf(500));
        }
    }
    
    @PostMapping("/responder-pregunta")
    public ResponseEntity<?> responderPregunta(@Valid @RequestBody ResponderPreguntaDto dto) {
        try {
            ArbolesRespuestaDto respuesta = arbolesServicio.responderPregunta(dto.tieneHijo());
            return new ResponseEntity<>(respuesta, HttpStatusCode.valueOf(200));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return new ResponseEntity<>("Error: " + e.getMessage(), HttpStatusCode.valueOf(400));
        } catch (Exception e) {
            return new ResponseEntity<>("Error interno: " + e.getMessage(), HttpStatusCode.valueOf(500));
        }
    }
    
    @PostMapping("/confirmar-hijo")
    public ResponseEntity<?> confirmarHijo(@Valid @RequestBody ConfirmarHijoDto dto) {
        try {
            ArbolesRespuestaDto respuesta = arbolesServicio.confirmarHijo(dto.valor());
            return new ResponseEntity<>(respuesta, HttpStatusCode.valueOf(200));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return new ResponseEntity<>("Error: " + e.getMessage(), HttpStatusCode.valueOf(400));
        } catch (Exception e) {
            return new ResponseEntity<>("Error interno: " + e.getMessage(), HttpStatusCode.valueOf(500));
        }
    }
    
    @PostMapping("/cancelar-hijo")
    public ResponseEntity<?> cancelarHijo() {
        try {
            ArbolesRespuestaDto respuesta = arbolesServicio.cancelarHijo();
            return new ResponseEntity<>(respuesta, HttpStatusCode.valueOf(200));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return new ResponseEntity<>("Error: " + e.getMessage(), HttpStatusCode.valueOf(400));
        } catch (Exception e) {
            return new ResponseEntity<>("Error interno: " + e.getMessage(), HttpStatusCode.valueOf(500));
        }
    }
    
    @GetMapping("/recorrido/{tipo}")
    public ResponseEntity<?> recorridoArbol(@PathVariable("tipo") String tipo) {
        try {
            ArbolesRespuestaDto respuesta = arbolesServicio.ejecutarRecorrido(tipo);
            return new ResponseEntity<>(respuesta, HttpStatusCode.valueOf(200));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return new ResponseEntity<>("Error: " + e.getMessage(), HttpStatusCode.valueOf(400));
        } catch (Exception e) {
            return new ResponseEntity<>("Error interno: " + e.getMessage(), HttpStatusCode.valueOf(500));
        }
    }
    
    @PostMapping("/reiniciar")
    public ResponseEntity<?> reiniciarArbol() {
        try {
            ArbolesRespuestaDto respuesta = arbolesServicio.reiniciarArbol();
            return new ResponseEntity<>(respuesta, HttpStatusCode.valueOf(200));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return new ResponseEntity<>("Error: " + e.getMessage(), HttpStatusCode.valueOf(400));
        } catch (Exception e) {
            return new ResponseEntity<>("Error interno: " + e.getMessage(), HttpStatusCode.valueOf(500));
        }
    }
}
