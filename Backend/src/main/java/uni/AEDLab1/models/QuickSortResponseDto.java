package uni.AEDLab1.models;

import java.util.List;

/**
 * Respuesta del endpoint de Quicksort que encapsula el arreglo ordenado,
 * la lista cronológica de pasos para la animación y un mensaje de estado.
 * 
 * @param sortedArray Arreglo final ordenado.
 * @param steps Lista de pasos secuenciales para animación en Frontend.
 * @param message Mensaje descriptivo del resultado.
 * 
 * @author samxdev7
 * @version 1.0
 */
public record QuickSortResponseDto(
    int[] sortedArray,
    List<QuickSortStepDto> steps,
    String message
) {}
