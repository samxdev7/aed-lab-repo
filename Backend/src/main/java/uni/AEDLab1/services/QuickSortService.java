package uni.AEDLab1.services;

import java.util.Arrays;
import org.springframework.stereotype.Service;
import uni.AEDLab1.models.QuickSortResponseDto;
import uni.AEDLab1.models.QuickSortStepDto;
import uni.AEDLab1.models.SwapLineDto;

/**
 * Servicio que maneja el algoritmo de ordenamiento por recursión Quicksort
 * bajo el esquema de partición original de Hoare.
 * Utiliza exclusivamente arreglos estáticos para registrar la traza paso a paso.
 * 
 * @author samxdev7
 * @version 2.0
 */
@Service
public class QuickSortService {

    public static final int SIZE = 10;
    private QuickSortStepDto[] steps;
    private int stepCount;

    /**
     * Valida si el arreglo contiene elementos repetidos usando arreglos estáticos.
     * 
     * @param arr Arreglo a verificar.
     * @return true si existen duplicados, false si todos son únicos.
     */
    public boolean hasDuplicates(int[] arr) {
        if (arr == null) return false;
        for (int i = 0; i < arr.length; i++) {
            for (int j = i + 1; j < arr.length; j++) {
                if (arr[i] == arr[j]) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * Ejecuta el ordenamiento Quicksort registrando la traza secuencial de pasos para animación.
     * 
     * @param arrayInput Arreglo de entrada de 10 elementos.
     * @return QuickSortResponseDto con el arreglo ordenado y el arreglo de pasos, o null si la entrada es inválida.
     */
    public synchronized QuickSortResponseDto executeQuickSort(int[] arrayInput) {
        if (arrayInput == null || arrayInput.length != SIZE || hasDuplicates(arrayInput)) {
            return null;
        }

        int[] arr = arrayInput.clone();
        this.steps = new QuickSortStepDto[128];
        this.stepCount = 0;

        // Paso inicial: estado base esperando inicio
        addStep(arr, null, null, null, new int[0], null,
            "INICIANDO PROCESO DE ORDENAMIENTO (Esquema Hoare Original)", "compare", new int[]{0, SIZE - 1});

        reduce(arr, 0, SIZE - 1);

        // Paso final: arreglo completamente ordenado
        addStep(arr, null, null, null, new int[0], null,
            "¡ORDENAMIENTO COMPLETADO!", "finish", null);

        QuickSortStepDto[] finalSteps = Arrays.copyOf(this.steps, this.stepCount);
        return new QuickSortResponseDto(arr, finalSteps, "Arreglo ordenado exitosamente.");
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
     */
    public void reduce(int[] arr, int start, int end) {
        if (start >= end) {
            if (start == end) {
                addStep(arr, null, null, null, new int[0], null,
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
        addStep(arr, pivotIndex, null, null, new int[0], null,
            "Iniciando partición Hoare en rango [" + start + " a " + end + "]. Pivote seleccionado: " + pivotValue + " en índice " + start + ".",
            "new_partition", range);

        while (true) {
            do {
                left++;
                addStep(arr, pivotIndex, left, (right <= end && right >= start ? right : null), new int[0], null,
                    "Avanzando i (" + left + "): valor [" + arr[left] + "]" + (arr[left] < pivotValue ? " < pivote (" + pivotValue + "), continúa avanzando." : " >= pivote (" + pivotValue + "), se detiene."),
                    "compare", range);
            } while (arr[left] < pivotValue);

            do {
                right--;
                addStep(arr, pivotIndex, left, right, new int[0], null,
                    "Retrocediendo j (" + right + "): valor [" + arr[right] + "]" + (arr[right] > pivotValue ? " > pivote (" + pivotValue + "), continúa retrocediendo." : " <= pivote (" + pivotValue + "), se detiene."),
                    "compare", range);
            } while (arr[right] > pivotValue);

            if (left >= right) {
                addStep(arr, pivotIndex, left, right, new int[0], null,
                    "Punteros cruzados (i=" + left + " >= j=" + right + "). Partición Hoare concluida. Punto de corte en índice " + right + ".",
                    "done", range);
                break;
            }

            // 2. Par detectado para intercambiar
            addStep(arr, pivotIndex, left, right, new int[]{left, right}, null,
                "¡Par encontrado! arr[" + left + "]=" + arr[left] + " y arr[" + right + "]=" + arr[right] + ". Preparando intercambio...",
                "found", range);

            // 3. Ejecución del intercambio
            swap(arr, left, right);

            // 4. Paso mostrando el arco y animación de swap
            addStep(arr, pivotIndex, left, right, new int[]{left, right}, new SwapLineDto(left, right),
                "Intercambiando arr[" + left + "] con arr[" + right + "]...",
                "swap", range);

            // 5. Intercambio completado
            addStep(arr, pivotIndex, left, right, new int[0], null,
                "Intercambio completado exitosamente.",
                "done", range);
        }

        // Llamadas recursivas del esquema Hoare: [start, right] y [right + 1, end]
        reduce(arr, start, right);
        reduce(arr, right + 1, end);
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

    private void addStep(int[] arr, Integer pivot, Integer i, Integer j,
                         int[] elevated, SwapLineDto swapLine, String phaseText, String action, int[] range) {
        if (stepCount >= steps.length) {
            steps = Arrays.copyOf(steps, steps.length * 2);
        }
        steps[stepCount++] = new QuickSortStepDto(
            arr.clone(),
            pivot,
            i,
            j,
            elevated != null ? elevated.clone() : new int[0],
            swapLine,
            phaseText,
            action,
            range != null ? range.clone() : null
        );
    }
}
