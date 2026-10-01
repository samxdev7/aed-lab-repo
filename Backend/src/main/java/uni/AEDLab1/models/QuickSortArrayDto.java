package uni.AEDLab1.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Transfiere el arreglo de elementos mediante una petición HTTP para el problema de "Quicksort".
 * 
 * @param arreglo Arreglo de elementos a ordenar.
 * 
 * Restricciones:
 * La longitud del arreglo debe ser igual a 10.
 * 
 * @author samxdev7
 * @version 2.0
 */
public record QuickSortArrayDto(
    @NotNull(message = "El arreglo no puede ser nulo.")
    @NotEmpty(message = "El arreglo no puede estar vacío.")
    @Size(min = 10, max = 10, message = "El arreglo debe tener obligatoriamente 10 elementos.")
    @JsonProperty("array")
    int[] arreglo
) {
    public int[] array() { return arreglo; }
}
