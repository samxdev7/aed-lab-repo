package uni.AEDLab1.models;

/**
 * Respuesta del endpoint de Quicksort con el arreglo ordenado,
 * los pasos secuenciales para animación y un mensaje de estado.
 */
public record QuickSortResponseDto(
    int[] sortedArray,
    QuickSortStepDto[] steps,
    String message
) {}
