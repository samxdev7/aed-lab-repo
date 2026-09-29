package uni.AEDLab1.models;

/**
 * Representa un paso atómico dentro del algoritmo Quicksort (esquema Hoare) para su animación.
 * 
 * @param array Instantánea del arreglo en este paso.
 * @param pivot Índice del elemento pivote seleccionado.
 * @param i Índice del puntero izquierdo (i).
 * @param j Índice del puntero derecho (j).
 * @param elevated Arreglo de índices a elevar o destacar visualmente.
 * @param swapLine Datos del arco de intercambio si ocurre un swap.
 * @param phaseText Texto explicativo de la acción para el usuario.
 * @param action Tipo de acción ('compare', 'found', 'swap', 'done', 'finish', 'new_partition').
 * @param range Subarreglo activo actual [inicio, fin].
 * 
 * @author samxdev7
 * @version 1.0
 */
public record QuickSortStepDto(
    int[] array,
    Integer pivot,
    Integer i,
    Integer j,
    int[] elevated,
    SwapLineDto swapLine,
    String phaseText,
    String action,
    int[] range
) {}
