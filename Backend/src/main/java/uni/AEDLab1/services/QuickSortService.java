package uni.AEDLab1.services;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import org.springframework.stereotype.Service;
import uni.AEDLab1.models.QuickSortResponseDto;
import uni.AEDLab1.models.QuickSortStepDto;
import uni.AEDLab1.models.SwapLineDto;

/**
 * Servicio que maneja el algoritmo de ordenamiento por recursión Quicksort
 * bajo el esquema de partición original de Hoare.
 * Genera la traza paso a paso para la animación interactiva en el Frontend.
 * 
 * @author samxdev7
 * @version 2.0
 */
@Service
public class QuickSortService {

    public static final int SIZE = 10;

    /**
     * Valida si el arreglo contiene elementos repetidos.
     * 
     * @param arr Arreglo a verificar.
     * @return true si existen duplicados, false si todos son únicos.
     */
    public boolean hasDuplicates(int[] arr) {
        if (arr == null) return false;
        Set<Integer> seen = new HashSet<>();
        for (int val : arr) {
            if (!seen.add(val)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Ejecuta el ordenamiento Quicksort registrando la traza secuencial de pasos para animación.
     * 
     * @param arrayInput Arreglo de entrada de 10 elementos.
     * @return QuickSortResponseDto con el arreglo ordenado y la lista de pasos, o null si la entrada es inválida o contiene duplicados.
     */
    public QuickSortResponseDto executeQuickSort(int[] arrayInput) {
        if (arrayInput == null || arrayInput.length != SIZE || hasDuplicates(arrayInput)) {
            return null;
        }

        int[] arr = arrayInput.clone();
        List<QuickSortStepDto> steps = new ArrayList<>();

        // Paso inicial: estado base esperando inicio
        addStep(steps, arr, null, null, null, new int[0], null,
            "INICIANDO PROCESO DE ORDENAMIENTO (Esquema Hoare Original)", "compare", new int[]{0, SIZE - 1});

        reduce(arr, 0, SIZE - 1, steps);

        // Paso final: arreglo completamente ordenado
        addStep(steps, arr, null, null, null, new int[0], null,
            "¡ORDENAMIENTO COMPLETADO!", "finish", null);

        return new QuickSortResponseDto(arr, steps, "Arreglo ordenado exitosamente.");
    }

    /**
     * Versión simplificada que solo devuelve el arreglo ordenado (retrocompatibilidad).
     * 
     * @param arrayInput Arreglo de entrada a ordenar.
     * @return int[] ordenado o null si es inválido.
     */
    public int[] quickSort(int[] arrayInput) {
        QuickSortResponseDto result = executeQuickSort(arrayInput);
        return result != null ? result.sortedArray() : null;
    }

    /**
     * Función recursiva reductora basada en la partición original de Sir Tony Hoare (1961).
     * El pivote se selecciona en 'start' y dos punteros convergen hacia el centro.
     * 
     * @param arr Arreglo de trabajo.
     * @param start Índice inferior del subarreglo.
     * @param end Índice superior del subarreglo.
     * @param steps Lista de acumulación de pasos.
     */
    public void reduce(int[] arr, int start, int end, List<QuickSortStepDto> steps) {
        if (start >= end) {
            if (start == end) {
                addStep(steps, arr, null, null, null, new int[0], null,
                    "Sub-arreglo de 1 elemento en índice " + start + " ya se encuentra ordenado.",
                    "new_partition", new int[]{start, end});
            }
            return;
        }

        int left = start - 1;
        int right = end + 1;
        int pivotValue = arr[start];
        int pivotIndex = start;
        int[] range = new int[]{start, end};

        // 1. Notificar inicio de nueva partición con pivote fijado
        addStep(steps, arr, pivotIndex, null, null, new int[0], null,
            "Iniciando partición Hoare en rango [" + start + " a " + end + "]. Pivote seleccionado: " + pivotValue + " en índice " + start + ".",
            "new_partition", range);

        while (true) {
            do {
                left++;
                addStep(steps, arr, pivotIndex, left, (right <= end && right >= start ? right : null), new int[0], null,
                    "Avanzando i (" + left + "): valor [" + arr[left] + "]" + (arr[left] < pivotValue ? " < pivote (" + pivotValue + "), continúa avanzando." : " >= pivote (" + pivotValue + "), se detiene."),
                    "compare", range);
            } while (arr[left] < pivotValue);

            do {
                right--;
                addStep(steps, arr, pivotIndex, left, right, new int[0], null,
                    "Retrocediendo j (" + right + "): valor [" + arr[right] + "]" + (arr[right] > pivotValue ? " > pivote (" + pivotValue + "), continúa retrocediendo." : " <= pivote (" + pivotValue + "), se detiene."),
                    "compare", range);
            } while (arr[right] > pivotValue);

            if (left >= right) {
                addStep(steps, arr, pivotIndex, left, right, new int[0], null,
                    "Punteros cruzados (i=" + left + " >= j=" + right + "). Partición Hoare concluida. Punto de corte en índice " + right + ".",
                    "done", range);
                break;
            }

            // 2. Par detectado para intercambiar
            addStep(steps, arr, pivotIndex, left, right, new int[]{left, right}, null,
                "¡Par encontrado! arr[" + left + "]=" + arr[left] + " y arr[" + right + "]=" + arr[right] + ". Preparando intercambio...",
                "found", range);

            // 3. Ejecución del intercambio
            swap(arr, left, right);

            // 4. Paso mostrando el arco y animación de swap
            addStep(steps, arr, pivotIndex, left, right, new int[]{left, right}, new SwapLineDto(left, right),
                "Intercambiando arr[" + left + "] con arr[" + right + "]...",
                "swap", range);

            // 5. Intercambio completado
            addStep(steps, arr, pivotIndex, left, right, new int[0], null,
                "Intercambio completado exitosamente.",
                "done", range);
        }

        // Llamadas recursivas del esquema Hoare: [start, right] y [right + 1, end]
        reduce(arr, start, right, steps);
        reduce(arr, right + 1, end, steps);
    }

    /**
     * Intercambia dos posiciones dentro del arreglo.
     * 
     * @param arr Arreglo en proceso de ordenamiento.
     * @param i Primer índice.
     * @param j Segundo índice.
     */
    public void swap(int[] arr, int i, int j) {
        int temp = arr[j];
        arr[j] = arr[i];
        arr[i] = temp;
    }

    private void addStep(List<QuickSortStepDto> steps, int[] arr, Integer pivot, Integer i, Integer j,
                        int[] elevated, SwapLineDto swapLine, String phaseText, String action, int[] range) {
        steps.add(new QuickSortStepDto(
            arr.clone(),
            pivot,
            i,
            j,
            elevated != null ? elevated.clone() : new int[0],
            swapLine,
            phaseText,
            action,
            range != null ? range.clone() : null
        ));
    }
}
