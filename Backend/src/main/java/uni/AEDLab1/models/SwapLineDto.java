package uni.AEDLab1.models;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Representa los índices de intercambio para la animación del arco en Quicksort.
 * 
 * @param origen Índice de origen del intercambio.
 * @param destino Índice de destino del intercambio.
 * 
 * @author samxdev7
 * @version 2.0
 */
public record SwapLineDto(
    @JsonProperty("from") int origen,
    @JsonProperty("to") int destino
) {
    public int from() { return origen; }
    public int to() { return destino; }
}
