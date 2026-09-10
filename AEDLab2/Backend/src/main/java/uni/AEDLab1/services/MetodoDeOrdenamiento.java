package uni.AEDLab1.services;

// Se define un contrato para los seis métodos de ordenacion diferentes implementados.
// Se aplica polimorfismo para la función que permitirá el ordenamiento de los arreglos ingresados.
public abstract class MetodoDeOrdenamiento {
    
    /**
     * @param n Indice del último elemento del arreglo desordenado.
     * @param arreglo Arreglo la cual se le aplicará un método de ordenacion
     * @return Devuelve el arreglo ordenado.
     */
    public abstract int[] ordenar(int n, int[] arreglo);
}
