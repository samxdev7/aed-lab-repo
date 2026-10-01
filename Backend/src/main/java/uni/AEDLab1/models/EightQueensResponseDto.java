package uni.AEDLab1.models;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Respuesta inmutable para el problema de las ocho reinas (tablero 8x8).
 * 
 * @param solucion Matriz con las coordenadas de la solución.
 * @param pasos Arreglo de pasos de colocación y verificación.
 * @param esValido Indica si la configuración completa es válida sin amenazas.
 * @param mensaje Mensaje descriptivo del resultado.
 */
public record EightQueensResponseDto(
    @JsonProperty("solution") int[][] solucion,
    @JsonProperty("steps") QueenStepDto[] pasos,
    @JsonProperty("valid") boolean esValido,
    @JsonProperty("message") String mensaje
) {
    public int[][] solution() { return solucion; }
    public QueenStepDto[] steps() { return pasos; }
    public boolean valid() { return esValido; }
    public String message() { return mensaje; }
}
