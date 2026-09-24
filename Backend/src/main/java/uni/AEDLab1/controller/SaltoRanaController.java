package uni.AEDLab1.controller;

import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import uni.AEDLab1.models.MovimientoRanaDto;
import uni.AEDLab1.models.SaltoRanaRespuestaDto;
import uni.AEDLab1.services.SaltoRanaServicio;

import java.util.Arrays;

@RestController
@RequestMapping("/api/salto-rana")
public class SaltoRanaController {

    private static final int RANAS_POR_LADO_MINIMO = 1;
    private static final int RANAS_POR_LADO_MAXIMO = 6;

    private final SaltoRanaServicio servicioSaltoRana = new SaltoRanaServicio();

    @GetMapping("/resolver")
    public ResponseEntity<?> resolver(@RequestParam(defaultValue = "3") int ranasPorLado) {
        if (ranasPorLado < RANAS_POR_LADO_MINIMO || ranasPorLado > RANAS_POR_LADO_MAXIMO) {
            return new ResponseEntity<>(
                "Error: La cantidad de ranas por lado debe estar entre "
                    + RANAS_POR_LADO_MINIMO + " y " + RANAS_POR_LADO_MAXIMO + ".",
                HttpStatusCode.valueOf(400)
            );
        }

        try {
            MovimientoRanaDto[] movimientos = servicioSaltoRana.resolver(ranasPorLado);
            String estadoFinal = movimientos[movimientos.length - 1].estadoResultante();

            SaltoRanaRespuestaDto respuesta = new SaltoRanaRespuestaDto(
                "V".repeat(ranasPorLado) + "_" + "C".repeat(ranasPorLado),
                estadoFinal,
                movimientos.length,
                Arrays.asList(movimientos)
            );

            return new ResponseEntity<>(respuesta, HttpStatusCode.valueOf(200));
        } catch (IllegalStateException excepcionSinSolucion) {
            return new ResponseEntity<>("Error: " + excepcionSinSolucion.getMessage(), HttpStatusCode.valueOf(400));
        }
    }
}