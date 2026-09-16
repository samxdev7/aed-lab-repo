package uni.AEDLab1.services;

/**
 *  Servicio que maneja el algoritmo de ordenamento por recursion Quicksort, recibiendo un arreglo
 *  de entrada para luego reducirlo por comparacion de pivote.
 * 
 *  @author samxdev7
 *  @version 1.0
 */
public class QuickSortService {
    private final int SIZE = 10;
    private int[] array;

    /**
     *  Funcion principal que valida la entrada y ejecuta el primer paso de Quicksort.
     *  @param arrayInput -> Arreglo de entrada a ordenar. 
     * 
     *  @return int[] / null -> Arreglo ordenado o null de manejo de error.
     */
    public int[] quickSort(int[] arrayInput) {
        if (arrayInput.length != SIZE) return null;
        
        this.array = arrayInput;
        int left = 0, right = SIZE - 1;
        reduce(left, right);
        return this.array;
    }
    
    /**
     *  Funcion reductora: toma un pivote para luego mandar a la izquierda todos los elementos
     *  mas pequeños que el mismo pivote. Una vez hecho eso se llama a la misma funcion con rangos
     *  seccionados del arreglo.
     *  @param start -> Indice minimo para el arreglo durante la llamada.
     *  @param end -> Indice maximo para el arreglo durante la llamada.
     */
    public void reduce(int start, int end) {
        if (start >= end) return;
        int left = start - 1, right = end + 1, pivot = array[start];
        
        while (true) {
            do { left++; } while (this.array[left] < pivot);
            do { right--; } while (this.array[right] > pivot);
            if (left >= right) break;
            swap(left, right);
        }
        
        reduce(start, right);
        reduce(right + 1, end);
    }
    
    /**
     *  Funcion de intercambio: pide dos indices del arreglo guardado en proceso de ordenacion
     *  para aplicar el intercambio por variable auxiliar.
     *  @param i -> Indice de intercambio para un elemento.
     *  @param j -> Indice de intercambio para otro elemento.
     */
    public void swap(int i, int j) {
        int temp = array[j];
        array[j] = array[i];
        array[i] = temp;
    }
}
 