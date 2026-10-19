package uni.AEDLab1.controller;

import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import uni.AEDLab1.models.NotacionPolacaPeticionDto;
import uni.AEDLab1.models.NotacionPolacaRespuestaDto;
import uni.AEDLab1.services.NotacionPolacaServicio;

@RestController
@RequestMapping("/api/notacion-polaca")
public class NotacionPolacaController {

    private final NotacionPolacaServicio notacionPolacaServicio;

    public NotacionPolacaController(NotacionPolacaServicio notacionPolacaServicio) {
        this.notacionPolacaServicio = notacionPolacaServicio;
    }

    @PostMapping("/convertir")
    public ResponseEntity<?> convertir(@RequestBody NotacionPolacaPeticionDto peticion) {
        try {
            NotacionPolacaRespuestaDto respuesta = notacionPolacaServicio.convertir(peticion);
            return new ResponseEntity<>(respuesta, HttpStatusCode.valueOf(200));
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>("Error: " + e.getMessage(), HttpStatusCode.valueOf(400));
        } catch (Exception e) {
            return new ResponseEntity<>("Error interno: " + e.getMessage(), HttpStatusCode.valueOf(500));
        }
    }
}
