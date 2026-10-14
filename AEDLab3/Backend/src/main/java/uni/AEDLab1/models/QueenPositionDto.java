package uni.AEDLab1.models;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;

/**
 * Transfiere las coordenadas de una reina mediante una petición HTTP para el problema de "Las 8 reinas".
 * 
 * @param x Posición de la reina en la coordenada x.
 * @param y Posición de la reina en la coordenada y.
 * 
 * Restricciones:
 * 0 <= x <= 7 y 0 <= y <= 7
 * 
 * @author samxdev7
 * @version 2.0
 */
public record QueenPositionDto(
    @Min(value = 0, message = "La posición de la pieza debe estar dentro de una columna (mínimo 0).")
    @Max(value = 7, message = "La posición de la pieza debe estar dentro de una columna (máximo 7).")
    int x, 
        
    @Min(value = 0, message = "La posición de la pieza debe estar dentro de una fila (mínimo 0).")
    @Max(value = 7, message = "La posición de la pieza debe estar dentro de una fila (máximo 7).")
    int y
) {}
