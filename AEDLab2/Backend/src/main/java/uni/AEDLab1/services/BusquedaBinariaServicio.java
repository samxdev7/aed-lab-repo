package uni.AEDLab1.services;

import uni.AEDLab1.models.BusquedaBinariaDto;

public class BusquedaBinariaServicio {
    // Clase utilizada para devolver arreglo ordenado y el indice del elemento encotrado para el
    // panel de Búsqueda Binaria.
    public record ResultadoBusqueda(int[] arregloOrdenado, int indiceElementoEncontrado) {}
    
    // Binary Search
    public int buscarElemento(BusquedaBinariaDto entradas) {
        int tam = entradas.tam();
        int[] arregloOrdenado = entradas.arreglo();
        int x = entradas.objetivo();
        
        try {
            int inicio = 0, fin = tam - 1, centro = 0;
            boolean encontrado = false;
            while ((inicio <= fin) && (encontrado == false)) {
                centro = (int) (inicio + fin) / 2;

                if (x == arregloOrdenado[centro]) encontrado = true;
                else if (x < arregloOrdenado[centro]) fin = centro - 1;
                else inicio = centro + 1;
            }

            if (encontrado == true) return centro;
            else return -1;
        } catch (Exception e) {
            return -1;
        }
    }
}
