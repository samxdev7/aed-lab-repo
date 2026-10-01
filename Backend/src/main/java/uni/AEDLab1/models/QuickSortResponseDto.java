package uni.AEDLab1.models;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Respuesta del endpoint de Quicksort con el arreglo ordenado,
 * los pasos secuenciales para animación y un mensaje de estado.
 * 
 * @param arregloOrdenado Arreglo ordenado resultante.
 * @param pasos Pasos de animación generados.
 * @param mensaje Mensaje descriptivo de estado.
 */
public record QuickSortResponseDto(
    @JsonProperty("sortedArray") int[] arregloOrdenado,
    @JsonProperty("steps") QuickSortStepDto[] pasos,
    @JsonProperty("message") String mensaje
) {
    public int[] sortedArray() { return arregloOrdenado; }
    public QuickSortStepDto[] steps() { return pasos; }
    public String message() { return mensaje; }
}
