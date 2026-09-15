package uni.AEDLab1.models;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

/**
 * Transfers the array of elements through HTTP Request for "Quicksort" problem.
 * 
 * @param int[] array, Array of elements to sort.
 * 
 * Constraints:
 * The array length must be equals to 10.
 * 
 * @author samxdev7
 * @version 1.0
 */
public record QuickSortArrayDto(
    @NotEmpty
    @Size(min = 10, max = 10, message = "El arreglo debe tener obligatoriamente 10 elementos.")
    int[] array
) {}
