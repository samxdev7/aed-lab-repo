package uni.AEDLab1.services;

import java.util.Arrays;
import org.springframework.stereotype.Service;
import uni.AEDLab1.models.QuickSortResponseDto;
import uni.AEDLab1.models.QuickSortStepDto;
import uni.AEDLab1.models.SwapLineDto;

/**
 * Servicio que gestiona el algoritmo de ordenamiento recursivo Quicksort.
 * Trabaja exclusivamente con arreglos estáticos nativos y mantiene la posición
 * del pivote fija durante las comparaciones de índices hasta su ubicación final.
 * 
 * @author samxdev7
 * @version 3.0
 */
@Service
public class QuickSortService {

    public static final int SIZE = 10;
    private QuickSortStepDto[] steps;
    private int stepCount;

    /**
     * Valida si el arreglo contiene elementos repetidos usando recursión pura sobre arreglos estáticos.
     * 
     * @param arr Arreglo a verificar.
     * @return true si existen duplicados, false si todos son únicos.
     */
    public boolean hasDuplicates(int[] arr) {
        if (arr == null) return false;
        return checkDuplicatesOuter(arr, 0);
    }

    private boolean checkDuplicatesOuter(int[] arr, int i) {
        if (i >= arr.length) return false;
        if (checkDuplicatesInner(arr, i, i + 1)) return true;
        return checkDuplicatesOuter(arr, i + 1);
    }

    private boolean checkDuplicatesInner(int[] arr, int i, int j) {
        if (j >= arr.length) return false;
        if (arr[i] == arr[j]) return true;
        return checkDuplicatesInner(arr, i, j + 1);
    }

    /**
     * Ejecuta QuickSort registrando la traza secuencial de pasos para la animación en Frontend.
     * 
     * @param arrayInput Arreglo de entrada de 10 elementos únicos.
     * @return QuickSortResponseDto con el arreglo ordenado y los pasos, o null si la entrada es inválida.
     */
    public synchronized QuickSortResponseDto executeQuickSort(int[] arrayInput) {
        if (arrayInput == null || arrayInput.length != SIZE || hasDuplicates(arrayInput)) {
            return null;
        }

        int[] arr = arrayInput.clone();
        this.steps = new QuickSortStepDto[128];
        this.stepCount = 0;

        addStep(arr, null, null, null, new int[0], null,
            "INICIANDO ORDENAMIENTO QUICKSORT", "new_partition", new int[]{0, SIZE - 1});

        reduce(arr, 0, SIZE - 1);

        addStep(arr, null, null, null, new int[0], null,
            "¡ORDENAMIENTO COMPLETADO!", "finish", null);

        return new QuickSortResponseDto(arr, Arrays.copyOf(this.steps, this.stepCount), "Arreglo ordenado exitosamente.");
    }

    /**
     * Versión simplificada que retorna el arreglo ordenado (retrocompatibilidad).
     * 
     * @param arrayInput Arreglo a ordenar.
     * @return Arreglo ordenado o null si es inválido.
     */
    public int[] quickSort(int[] arrayInput) {
        QuickSortResponseDto result = executeQuickSort(arrayInput);
        return result != null ? result.sortedArray() : null;
    }

    /**
     * Función recursiva de ordenamiento por división y conquista.
     * 
     * @param arr Arreglo de trabajo.
     * @param start Índice inicial del subarreglo.
     * @param end Índice final del subarreglo.
     */
    public void reduce(int[] arr, int start, int end) {
        if (start >= end) return;
        int p = partition(arr, start, end);
        reduce(arr, start, p - 1);
        reduce(arr, p + 1, end);
    }

    /**
     * Realiza la partición de Quicksort mediante recorrido recursivo puro.
     * El pivote permanece fijo en 'start' durante todo el escaneo recursivo de punteros.
     * 
     * @param arr Arreglo de trabajo.
     * @param start Índice inicial.
     * @param end Índice final.
     * @return Índice de la posición definitiva del pivote.
     */
    private int partition(int[] arr, int start, int end) {
        int pivot = arr[start];
        int[] range = new int[]{start, end};

        addStep(arr, start, null, null, new int[0], null,
            "Partición en rango [" + start + ".." + end + "]. Pivote asignado: " + pivot + " en índice " + start + ".",
            "new_partition", range);

        int j = scanAndSwapRecursive(arr, pivot, start, end, range, start + 1, end);

        // Punteros cruzados: ubicar el pivote en su posición final definitiva 'j'
        if (start != j) {
            addStep(arr, start, null, (j >= start ? j : null), new int[]{start, j}, null,
                "Punteros cruzados. Colocando pivote " + pivot + " en posición definitiva [" + j + "].",
                "found", range);

            swap(arr, start, j);

            addStep(arr, j, null, null, new int[]{start, j}, new SwapLineDto(start, j),
                "Pivote " + pivot + " ubicado en índice definitivo [" + j + "].",
                "swap", range);

            addStep(arr, j, null, null, new int[0], null,
                "Pivote " + pivot + " fijado en posición [" + j + "].",
                "done", range);
        } else {
            addStep(arr, start, null, null, new int[0], null,
                "Pivote " + pivot + " ya se encuentra en su posición definitiva [" + start + "].",
                "done", range);
        }

        return j;
    }

    private int advanceLeftRecursive(int[] arr, int pivot, int i, int end, int j, int start, int[] range) {
        if (i > end || arr[i] > pivot) {
            if (i <= end) {
                addStep(arr, start, i, (j >= start && j <= end ? j : null), new int[0], null,
                    "Puntero i (" + i + "): [" + arr[i] + "] > pivote (" + pivot + "), se detiene.",
                    "compare", range);
            }
            return i;
        }
        addStep(arr, start, i, (j >= start && j <= end ? j : null), new int[0], null,
            "Avanzando i (" + i + "): [" + arr[i] + "] <= pivote (" + pivot + ").",
            "compare", range);
        return advanceLeftRecursive(arr, pivot, i + 1, end, j, start, range);
    }

    private int retreatRightRecursive(int[] arr, int pivot, int j, int start, int i, int end, int[] range) {
        if (j <= start || arr[j] <= pivot) {
            if (j > start) {
                addStep(arr, start, (i <= end ? i : null), j, new int[0], null,
                    "Puntero j (" + j + "): [" + arr[j] + "] <= pivote (" + pivot + "), se detiene.",
                    "compare", range);
            }
            return j;
        }
        addStep(arr, start, (i <= end ? i : null), j, new int[0], null,
            "Retrocediendo j (" + j + "): [" + arr[j] + "] > pivote (" + pivot + ").",
            "compare", range);
        return retreatRightRecursive(arr, pivot, j - 1, start, i, end, range);
    }

    private int scanAndSwapRecursive(int[] arr, int pivot, int start, int end, int[] range, int i, int j) {
        if (i > j) {
            return j;
        }

        int nextI = advanceLeftRecursive(arr, pivot, i, end, j, start, range);
        int nextJ = retreatRightRecursive(arr, pivot, j, start, nextI, end, range);

        if (nextI < nextJ) {
            addStep(arr, start, nextI, nextJ, new int[]{nextI, nextJ}, null,
                "Par detectado: arr[" + nextI + "]=" + arr[nextI] + " y arr[" + nextJ + "]=" + arr[nextJ] + ". Preparando intercambio...",
                "found", range);

            swap(arr, nextI, nextJ);

            addStep(arr, start, nextI, nextJ, new int[]{nextI, nextJ}, new SwapLineDto(nextI, nextJ),
                "Intercambiando arr[" + nextI + "] con arr[" + nextJ + "]...",
                "swap", range);

            addStep(arr, start, nextI, nextJ, new int[0], null,
                "Intercambio completado.",
                "done", range);

            return scanAndSwapRecursive(arr, pivot, start, end, range, nextI + 1, nextJ - 1);
        } else {
            return nextJ;
        }
    }

    /**
     * Intercambia dos posiciones dentro del arreglo.
     * 
     * @param arr Arreglo en proceso de ordenamiento.
     * @param i Primer índice.
     * @param j Segundo índice.
     */
    public void swap(int[] arr, int i, int j) {
        int temp = arr[i];
        arr[i] = arr[j];
        arr[j] = temp;
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
