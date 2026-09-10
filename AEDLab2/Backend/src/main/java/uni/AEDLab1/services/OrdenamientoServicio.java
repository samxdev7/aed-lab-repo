package uni.AEDLab1.services;

import uni.AEDLab1.models.OrdenamientoDto;

public class OrdenamientoServicio {
    // Atributo para almacenar el tamaño del arreglo con el que se va a trabajar
    private static int tamanoGuardado = 0;

    public static int getTamanoGuardado() {
        return tamanoGuardado;
    }

    public static void setTamanoGuardado(int tamano) {
        tamanoGuardado = tamano;
    }

    /** Menú de métodos de ordenacion:
     * BURBUJA(1), 
     * BURBUJACONSENAL(2), 
     * BARAJA(3), 
     * SACUDIDA(4), 
     * SELECCION(5), 
     * SHELL(6);
     */
    
    // Bubble Sort: O(n²)
    private static class Burbuja extends MetodoDeOrdenamiento {
        @Override
        public int[] ordenar(int n, int[] arreglo) { 
            int tam = n;
            
            for (int i = 1; i <= tam; i++) {
                for (int j = 0; j < tam - 1; j++) {
                    if (arreglo[j] > arreglo[j + 1]) {
                        int temp = arreglo[j + 1];
                        arreglo[j + 1] = arreglo[j];
                        arreglo[j] = temp;
                    }
                }
            }
            
            return arreglo;
        }
    }
    
    // Optimized Bubble Sort: O(n²) o O(n)
    private static class BurbujaSenal extends MetodoDeOrdenamiento {
        @Override
        public int[] ordenar(int n, int[] arreglo) { 
            int tam = n;
            
            int i = 1;
            boolean band = false;
            while ((i < tam) && (band == false)) {
                band = true;
                for (int j = 0; j < tam - 1; j++) {
                    if (arreglo[j] > arreglo[j+1]) {
                        int temp = arreglo[j + 1];
                        arreglo[j + 1] = arreglo[j];
                        arreglo[j] = temp;
                        band = false;
                    }
                }
                i++;
            }
            return arreglo;
        }
    }
    
    // Insert Sort: O(n²) o O(n)
    private static class Baraja extends MetodoDeOrdenamiento {
        @Override
        public int[] ordenar(int n, int[] arreglo) { 
            int tam = n;
            
            // MetodoDeOrdenamiento Baraja / InsertSort
            for (int i = 1; i < tam; i++) {
                int aux = arreglo[i];
                int k = i - 1;
                while((k >= 0) && (aux < arreglo[k])){
                    arreglo[k + 1] = arreglo[k];
                    k--;
                }
                arreglo[k + 1] = aux;
            }
            
            return arreglo;
        }
    }
    
    // Cocktail Shaker Sort: O(n²) o O(n)
    private static class Sacudida extends MetodoDeOrdenamiento {
        @Override
        public int[] ordenar(int n, int[] arreglo) { 
            int tam = n;
            
            // MetodoDeOrdenamiento Sacudida
            int izq = 1, der = tam - 1 , k = tam - 1;
            
            // Se cambia a der >= izq para asegurar la ordenación de elementos adyacentes 
            // cuando los límites coinciden.
            while (der >= izq) {
                for (int i = der; i >= izq; i--) {
                    if (arreglo[i - 1] > arreglo[i]) {
                        int temp = arreglo[i-1];
                        arreglo[i-1] = arreglo[i];
                        arreglo[i] = temp;
                        k = i;
                    }
                }
                izq = k + 1;
                
                for (int i = izq; i <= der; i++) {
                    if (arreglo[i - 1] > arreglo[i]) {
                        int temp = arreglo[i-1];
                        arreglo[i-1] = arreglo[i];
                        arreglo[i] = temp;
                        k = i;
                    }
                }
                der = k - 1;
            }
            
            return arreglo;
        }

    }
    
    // Seleccion Sort: O(n²) o O(n)
    private static class Seleccion extends MetodoDeOrdenamiento {
        @Override
        public int[] ordenar(int n, int[] arreglo) { 
            int tam = n;
            
            for (int i = 0; i < tam; i++) {
                int menor = arreglo[i];
                int k = i;
                for (int j = i + 1; j < tam; j++) {
                    if (arreglo[j] < menor) {
                        menor = arreglo[j];
                        k = j;
                    }
                }
                arreglo[k] = arreglo[i];
                arreglo[i] = menor;
            }
            
            return arreglo;
        }
    }
    
    // Shell Sort: O(n²) - O(n * log (n))
    private static class Shell extends MetodoDeOrdenamiento {
        @Override
        public int[] ordenar(int n, int[] arreglo) { 
            int tam = n;            
            int ent = (int) (tam / 2);
            
            while (ent > 0) {
                boolean band = true;
                while (band == true) {
                    band = false;
                    int i = 0;
                    while ((i + ent) < tam) {
                        if (arreglo[i] > arreglo[i + ent]) {
                            int temp = arreglo[i];
                            arreglo[i] = arreglo[i + ent];
                            arreglo[i + ent] = temp;
                            band = true;
                        }
                        i++;
                    }
                }
                ent = (int) (ent / 2);
            }
            
            return arreglo;
        }
    }
    
    public static int[] ejecutar(OrdenamientoDto datos) {
        MetodoDeOrdenamiento algoritmoOrdenacion;
        int[] arreglo = datos.arreglo(), arregloOrdenado;
        
        if ((arreglo == null) || (arreglo.length != datos.tam())) {
            return null;
        }
                
        switch (datos.metodoDeOrdenamiento()) {
            case 1 -> algoritmoOrdenacion = new Burbuja();
            case 2 -> algoritmoOrdenacion = new BurbujaSenal();
            case 3 -> algoritmoOrdenacion = new Baraja();
            case 4 -> algoritmoOrdenacion = new Sacudida();
            case 5 -> algoritmoOrdenacion = new Seleccion();
            case 6 -> algoritmoOrdenacion = new Shell();
            default -> algoritmoOrdenacion = null;
        }
        
        // Se valida si se eligio alguno de los métodos de ordenación permitidos
        if (algoritmoOrdenacion == null) { 
            return null; 
        }
        
        try {
            arregloOrdenado = algoritmoOrdenacion.ordenar(datos.tam(), arreglo);
            return arregloOrdenado;
        } catch (Exception e) {
            return null;
        }
    }
}
