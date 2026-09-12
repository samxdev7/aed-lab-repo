package uni.AEDLab1.models;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;

/**
 * Transfers the coordinates for a random queen through HTTP Request for "Las 8 reinas" problem.
 * 
 * @param int x, Queen position in x-coordinate.
 * @param int y, Queen position in y-coordinate.
 * 
 * Constraints:
 * 0 <= x <= 8 and 0 <= y <= 8
 * 
 * @author samxdev7
 * @version 1.0
 */
public record QueenPositionDto(
    @Min(value = 0, message = "La posicion de la pieza debe estar dentro de una columna (mínimo 0).")
    @Max(value = 7, message = "La posicion de la pieza debe estar dentro de una columna (máximo 7).")
    int x, 
        
    @Min(value = 0, message = "La posicion de la pieza debe estar dentro de una fila (mínimo 0).")
    @Max(value = 7, message = "La posicion de la pieza debe estar dentro de una fila (máximo 7).")
    int y
) {}
