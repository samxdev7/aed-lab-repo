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

    public static final int TAMANO = 10;
    private QuickSortStepDto[] pasos;
    private int conteoPasos;

    /**
     * Valida si el arreglo contiene elementos repetidos usando recursión pura sobre arreglos estáticos.
     * 
     * @param arreglo Arreglo a verificar.
     * @return true si existen duplicados, false si todos son únicos.
     */
    public boolean tieneDuplicados(int[] arreglo) {
        if (arreglo == null) return false;
        return verificarDuplicadosExterior(arreglo, 0);
    }

    private boolean verificarDuplicadosExterior(int[] arreglo, int i) {
        if (i >= arreglo.length) return false;
        if (verificarDuplicadosInterior(arreglo, i, i + 1)) return true;
        return verificarDuplicadosExterior(arreglo, i + 1);
    }

    private boolean verificarDuplicadosInterior(int[] arreglo, int i, int j) {
        if (j >= arreglo.length) return false;
        if (arreglo[i] == arreglo[j]) return true;
        return verificarDuplicadosInterior(arreglo, i, j + 1);
    }

    /**
     * Ejecuta QuickSort registrando la traza secuencial de pasos para la animación en Frontend.
     * 
     * @param arregloEntrada Arreglo de entrada de 10 elementos únicos.
     * @return QuickSortResponseDto con el arreglo ordenado y los pasos, o null si la entrada es inválida.
     */
    public synchronized QuickSortResponseDto ejecutarQuickSort(int[] arregloEntrada) {
        if (arregloEntrada == null || arregloEntrada.length != TAMANO || tieneDuplicados(arregloEntrada)) {
            return null;
        }

        int[] arreglo = arregloEntrada.clone();
        this.pasos = new QuickSortStepDto[128];
        this.conteoPasos = 0;

        agregarPaso(arreglo, null, null, null, new int[0], null,
            "INICIANDO ORDENAMIENTO QUICKSORT", "new_partition", new int[]{0, TAMANO - 1});

        reducir(arreglo, 0, TAMANO - 1);

        agregarPaso(arreglo, null, null, null, new int[0], null,
            "¡ORDENAMIENTO COMPLETADO!", "finish", null);

        return new QuickSortResponseDto(
            arreglo,
            Arrays.copyOf(this.pasos, this.conteoPasos),
            "Arreglo ordenado exitosamente."
        );
    }

    /**
     * Función recursiva de ordenamiento por división y conquista.
     * 
     * @param arreglo Arreglo de trabajo.
     * @param inicio Índice inicial del subarreglo.
     * @param fin Índice final del subarreglo.
     */
    public void reducir(int[] arreglo, int inicio, int fin) {
        if (inicio >= fin) return;
        int p = particionar(arreglo, inicio, fin);
        reducir(arreglo, inicio, p - 1);
        reducir(arreglo, p + 1, fin);
    }

    /**
     * Realiza la partición de Quicksort mediante recorrido recursivo puro.
     * El pivote permanece fijo en 'inicio' durante todo el escaneo recursivo de punteros.
     * 
     * @param arreglo Arreglo de trabajo.
     * @param inicio Índice inicial.
     * @param fin Índice final.
     * @return Índice de la posición definitiva del pivote.
     */
    private int particionar(int[] arreglo, int inicio, int fin) {
        int pivote = arreglo[inicio];
        int[] rango = new int[]{inicio, fin};

        agregarPaso(arreglo, inicio, null, null, new int[0], null,
            "Partición en rango [" + inicio + ".." + fin + "]. Pivote asignado: " + pivote + " en índice " + inicio + ".",
            "new_partition", rango);

        int j = escanearEIntercambiarRecursivo(arreglo, pivote, inicio, fin, rango, inicio + 1, fin);

        // Punteros cruzados: ubicar el pivote en su posición final definitiva 'j'
        if (inicio != j) {
            agregarPaso(arreglo, inicio, null, (j >= inicio ? j : null), new int[]{inicio, j}, null,
                "Punteros cruzados. Colocando pivote " + pivote + " en posición definitiva [" + j + "].",
                "found", rango);

            intercambiar(arreglo, inicio, j);

            agregarPaso(arreglo, j, null, null, new int[]{inicio, j}, new SwapLineDto(inicio, j),
                "Pivote " + pivote + " ubicado en índice definitivo [" + j + "].",
                "swap", rango);

            agregarPaso(arreglo, j, null, null, new int[0], null,
                "Pivote " + pivote + " fijado en posición [" + j + "].",
                "done", rango);
        } else {
            agregarPaso(arreglo, inicio, null, null, new int[0], null,
                "Pivote " + pivote + " ya se encuentra en su posición definitiva [" + inicio + "].",
                "done", rango);
        }

        return j;
    }

    private int avanzarIzquierdaRecursivo(int[] arreglo, int pivote, int i, int fin, int j, int inicio, int[] rango) {
        if (i > fin || arreglo[i] > pivote) {
            if (i <= fin) {
                agregarPaso(arreglo, inicio, i, (j >= inicio && j <= fin ? j : null), new int[0], null,
                    "Puntero i (" + i + "): [" + arreglo[i] + "] > pivote (" + pivote + "), se detiene.",
                    "compare", rango);
            }
            return i;
        }
        agregarPaso(arreglo, inicio, i, (j >= inicio && j <= fin ? j : null), new int[0], null,
            "Avanzando i (" + i + "): [" + arreglo[i] + "] <= pivote (" + pivote + ").",
            "compare", rango);
        return avanzarIzquierdaRecursivo(arreglo, pivote, i + 1, fin, j, inicio, rango);
    }

    private int retrocederDerechaRecursivo(int[] arreglo, int pivote, int j, int inicio, int i, int fin, int[] rango) {
        if (j <= inicio || arreglo[j] <= pivote) {
            if (j > inicio) {
                agregarPaso(arreglo, inicio, (i <= fin ? i : null), j, new int[0], null,
                    "Puntero j (" + j + "): [" + arreglo[j] + "] <= pivote (" + pivote + "), se detiene.",
                    "compare", rango);
            }
            return j;
        }
        agregarPaso(arreglo, inicio, (i <= fin ? i : null), j, new int[0], null,
            "Retrocediendo j (" + j + "): [" + arreglo[j] + "] > pivote (" + pivote + ").",
            "compare", rango);
        return retrocederDerechaRecursivo(arreglo, pivote, j - 1, inicio, i, fin, rango);
    }

    private int escanearEIntercambiarRecursivo(int[] arreglo, int pivote, int inicio, int fin, int[] rango, int i, int j) {
        if (i > j) {
            return j;
        }

        int siguienteI = avanzarIzquierdaRecursivo(arreglo, pivote, i, fin, j, inicio, rango);
        int siguienteJ = retrocederDerechaRecursivo(arreglo, pivote, j, inicio, siguienteI, fin, rango);

        if (siguienteI < siguienteJ) {
            agregarPaso(arreglo, inicio, siguienteI, siguienteJ, new int[]{siguienteI, siguienteJ}, null,
                "Par detectado: arr[" + siguienteI + "]=" + arreglo[siguienteI] + " y arr[" + siguienteJ + "]=" + arreglo[siguienteJ] + ". Preparando intercambio...",
                "found", rango);

            intercambiar(arreglo, siguienteI, siguienteJ);

            agregarPaso(arreglo, inicio, siguienteI, siguienteJ, new int[]{siguienteI, siguienteJ}, new SwapLineDto(siguienteI, siguienteJ),
                "Intercambiando arr[" + siguienteI + "] con arr[" + siguienteJ + "]...",
                "swap", rango);

            agregarPaso(arreglo, inicio, siguienteI, siguienteJ, new int[0], null,
                "Intercambio completado.",
                "done", rango);

            return escanearEIntercambiarRecursivo(arreglo, pivote, inicio, fin, rango, siguienteI + 1, siguienteJ - 1);
        } else {
            return siguienteJ;
        }
    }

    /**
     * Intercambia dos posiciones dentro del arreglo.
     * 
     * @param arreglo Arreglo en proceso de ordenamiento.
     * @param i Primer índice.
     * @param j Segundo índice.
     */
    public void intercambiar(int[] arreglo, int i, int j) {
        int temporal = arreglo[i];
        arreglo[i] = arreglo[j];
        arreglo[j] = temporal;
    }

    private void agregarPaso(int[] arreglo, Integer pivote, Integer i, Integer j,
                             int[] elevados, SwapLineDto lineaIntercambio, String textoFase, String accion, int[] rango) {
        if (conteoPasos >= pasos.length) {
            pasos = Arrays.copyOf(pasos, pasos.length * 2);
        }
        pasos[conteoPasos++] = new QuickSortStepDto(
            arreglo.clone(),
            pivote,
            i,
            j,
            elevados != null ? elevados.clone() : new int[0],
            lineaIntercambio,
            textoFase,
            accion,
            rango != null ? rango.clone() : null
        );
    }
}
