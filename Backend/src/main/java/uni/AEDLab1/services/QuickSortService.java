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
     * Valida si el arreglo contiene elementos repetidos usando arreglos estáticos.
     * 
     * @param arr Arreglo a verificar.
     * @return true si existen duplicados, false si todos son únicos.
     */
    public boolean hasDuplicates(int[] arr) {
        if (arr == null) return false;
        for (int i = 0; i < arr.length; i++) {
            for (int j = i + 1; j < arr.length; j++) {
                if (arr[i] == arr[j]) return true;
            }
        }
        return false;
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
     * Realiza la partición de Quicksort con el pivote asignado al inicio ('start').
     * Durante la comparación y escaneo de los punteros 'i' y 'j', el pivote permanece
     * fijo en su posición asignada para evitar inconsistencias visuales en las comparaciones.
     * Al concluir el cruce de punteros, el pivote se traslada a su posición definitiva 'j'.
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

        int i = start + 1;
        int j = end;

        while (i <= j) {
            while (i <= end && arr[i] <= pivot) {
                addStep(arr, start, i, (j >= start && j <= end ? j : null), new int[0], null,
                    "Avanzando i (" + i + "): [" + arr[i] + "] <= pivote (" + pivot + ").",
                    "compare", range);
                i++;
            }
            if (i <= end) {
                addStep(arr, start, i, (j >= start && j <= end ? j : null), new int[0], null,
                    "Puntero i (" + i + "): [" + arr[i] + "] > pivote (" + pivot + "), se detiene.",
                    "compare", range);
            }

            while (j > start && arr[j] > pivot) {
                addStep(arr, start, (i <= end ? i : null), j, new int[0], null,
                    "Retrocediendo j (" + j + "): [" + arr[j] + "] > pivote (" + pivot + ").",
                    "compare", range);
                j--;
            }
            if (j > start) {
                addStep(arr, start, (i <= end ? i : null), j, new int[0], null,
                    "Puntero j (" + j + "): [" + arr[j] + "] <= pivote (" + pivot + "), se detiene.",
                    "compare", range);
            }

            if (i < j) {
                addStep(arr, start, i, j, new int[]{i, j}, null,
                    "Par detectado: arr[" + i + "]=" + arr[i] + " y arr[" + j + "]=" + arr[j] + ". Preparando intercambio...",
                    "found", range);

                swap(arr, i, j);

                addStep(arr, start, i, j, new int[]{i, j}, new SwapLineDto(i, j),
                    "Intercambiando arr[" + i + "] con arr[" + j + "]...",
                    "swap", range);

                addStep(arr, start, i, j, new int[0], null,
                    "Intercambio completado.",
                    "done", range);

                i++;
                j--;
            }
        }

        // Punteros cruzados: ubicar el pivote en su posición final definitiva 'j'
        if (start != j) {
            addStep(arr, start, (i <= end ? i : null), (j >= start ? j : null), new int[]{start, j}, null,
                "Punteros cruzados (i=" + i + " > j=" + j + "). Colocando pivote " + pivot + " en posición definitiva [" + j + "].",
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
