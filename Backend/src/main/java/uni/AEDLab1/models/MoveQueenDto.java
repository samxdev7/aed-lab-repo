package uni.AEDLab1.models;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;

/**
 * Transfers the coordinates for make a random queen move within the table through HTTP Request 
 * for "Las 8 reinas" problem.
 * 
 * @param int x1, Current queen position in x-coordinate.
 * @param int y1, Current queen position in y-coordinate.
 * @param int x2, New queen position in x-coordinate.
 * @param int y2, New queen position in y-coordinate.
 * 
 * Constraints:
 * 0 <= x1 <= 8 and 0 <= y1 <= 8 and 0 <= x2 <= 8 and 0 <= y2 <= 8
 * 
 * @author samxdev7
 * @version 1.0
 */
public record MoveQueenDto(
    @Min(value = 0, message = "La posicion de la pieza debe estar dentro de una columna (mínimo 0).")
    @Max(value = 7, message = "La posicion de la pieza debe estar dentro de una columna (máximo 7).")
    int x1,
        
    @Min(value = 0, message = "La posicion de la pieza debe estar dentro de una fila (mínimo 0).")
    @Max(value = 7, message = "La posicion de la pieza debe estar dentro de una fila (máximo 7).")
    int y1,
    
    @Min(value = 0, message = "La posicion de la pieza debe estar dentro de una columna (mínimo 0).")
    @Max(value = 7, message = "La posicion de la pieza debe estar dentro de una columna (máximo 7).")
    int x2,
        
    @Min(value = 0, message = "La posicion de la pieza debe estar dentro de una fila (mínimo 0).")
    @Max(value = 7, message = "La posicion de la pieza debe estar dentro de una fila (máximo 7).")
    int y2
) {}
