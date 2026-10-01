package uni.AEDLab1.models;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Representa un paso atómico dentro del algoritmo Quicksort (esquema Hoare) para su animación.
 * 
 * @param arreglo Instantánea del arreglo en este paso.
 * @param pivote Índice del elemento pivote seleccionado.
 * @param i Índice del puntero izquierdo (i).
 * @param j Índice del puntero derecho (j).
 * @param elevados Arreglo de índices a elevar o destacar visualmente.
 * @param lineaIntercambio Datos del arco de intercambio si ocurre un swap.
 * @param textoFase Texto explicativo de la acción para el usuario.
 * @param accion Tipo de acción ('compare', 'found', 'swap', 'done', 'finish', 'new_partition').
 * @param rango Subarreglo activo actual [inicio, fin].
 * 
 * @author samxdev7
 * @version 2.0
 */
public record QuickSortStepDto(
    @JsonProperty("array") int[] arreglo,
    @JsonProperty("pivot") Integer pivote,
    @JsonProperty("i") Integer i,
    @JsonProperty("j") Integer j,
    @JsonProperty("elevated") int[] elevados,
    @JsonProperty("swapLine") SwapLineDto lineaIntercambio,
    @JsonProperty("phaseText") String textoFase,
    @JsonProperty("action") String accion,
    @JsonProperty("range") int[] rango
) {
    public int[] array() { return arreglo; }
    public Integer pivot() { return pivote; }
    public int[] elevated() { return elevados; }
    public SwapLineDto swapLine() { return lineaIntercambio; }
    public String phaseText() { return textoFase; }
    public String action() { return accion; }
    public int[] range() { return rango; }
}
