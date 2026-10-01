package uni.AEDLab1.models;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Representa un paso en la colocación y verificación recursiva de las 8 reinas.
 * 
 * @param paso Número de paso (1 a 8).
 * @param fila Fila del tablero (0 a 7).
 * @param columna Columna del tablero (0 a 7).
 * @param notacion Notación algebraica de la casilla (ej. "Reina 1 [a8]").
 * @param verificado Indica si la reina fue verificada recursivamente sin amenazas.
 * @param mensaje Mensaje descriptivo de la validación.
 * 
 * @author samxdev7
 * @version 2.0
 */
public record QueenStepDto(
    @JsonProperty("step") int paso,
    @JsonProperty("row") int fila,
    @JsonProperty("col") int columna,
    @JsonProperty("notation") String notacion,
    @JsonProperty("verified") boolean verificado,
    @JsonProperty("message") String mensaje
) {}
