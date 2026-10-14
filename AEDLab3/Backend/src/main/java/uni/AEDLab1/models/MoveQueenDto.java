package uni.AEDLab1.models;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;

/**
 * Transfiere las coordenadas para realizar el movimiento de una reina en el tablero
 * mediante una petición HTTP para el problema de "Las 8 reinas".
 * 
 * @param x1 Posición actual de la reina en la coordenada x.
 * @param y1 Posición actual de la reina en la coordenada y.
 * @param x2 Nueva posición de la reina en la coordenada x.
 * @param y2 Nueva posición de la reina en la coordenada y.
 * 
 * Restricciones:
 * 0 <= x1 <= 7 y 0 <= y1 <= 7 y 0 <= x2 <= 7 y 0 <= y2 <= 7
 * 
 * @author samxdev7
 * @version 2.0
 */
public record MoveQueenDto(
    @Min(value = 0, message = "La posición de la pieza debe estar dentro de una columna (mínimo 0).")
    @Max(value = 7, message = "La posición de la pieza debe estar dentro de una columna (máximo 7).")
    int x1,
        
    @Min(value = 0, message = "La posición de la pieza debe estar dentro de una fila (mínimo 0).")
    @Max(value = 7, message = "La posición de la pieza debe estar dentro de una fila (máximo 7).")
    int y1,
    
    @Min(value = 0, message = "La posición de la pieza debe estar dentro de una columna (mínimo 0).")
    @Max(value = 7, message = "La posición de la pieza debe estar dentro de una columna (máximo 7).")
    int x2,
        
    @Min(value = 0, message = "La posición de la pieza debe estar dentro de una fila (mínimo 0).")
    @Max(value = 7, message = "La posición de la pieza debe estar dentro de una fila (máximo 7).")
    int y2
) {}
