package uni.AEDLab1.services;

import org.springframework.stereotype.Service;
import uni.AEDLab1.models.EightQueensResponseDto;
import uni.AEDLab1.models.QueenStepDto;

/**
 * Servicio que gestiona la verificación recursiva del problema de las 8 reinas (8x8).
 * Utiliza exclusivamente arreglos estáticos y algoritmos recursivos puros sin bucles.
 * 
 * @author samxdev7
 * @version 2.0
 */
@Service
public class OchoReinasService {

    public static final int TAMANO = 8;
    public static final int[] SOLUCION = {0, 4, 7, 5, 2, 6, 1, 3};

    /**
     * Genera la traza paso a paso de colocación y verificación recursiva de las 8 reinas.
     * 
     * @return EightQueensResponseDto con la matriz de solución y los 8 pasos verificados recursivamente.
     */
    public EightQueensResponseDto resolverConTrazaRecursiva() {
        QueenStepDto[] pasos = new QueenStepDto[TAMANO];
        llenarPasosRecursivo(pasos, 0);

        return new EightQueensResponseDto(
            obtenerMatrizSolucion(),
            pasos,
            verificarTodoRecursivo(SOLUCION, TAMANO),
            "Las ocho reinas fueron verificadas recursivamente sin amenazas mutuas."
        );
    }

    /**
     * Método de compatibilidad hacia atrás para resolver con traza recursiva.
     */
    public EightQueensResponseDto solveWithRecursiveTrace() {
        return resolverConTrazaRecursiva();
    }

    private void llenarPasosRecursivo(QueenStepDto[] pasos, int fila) {
        if (fila >= TAMANO) return;
        int columna = SOLUCION[fila];
        boolean esSeguro = esSeguroRecursivo(fila, columna, SOLUCION, fila - 1);
        String notacion = "REINA " + (fila + 1) + " [" + (char) ('A' + columna) + (8 - fila) + "]";
        String mensaje = "Reina " + (fila + 1) + " colocada en (" + fila + ", " + columna + ") y verificada recursivamente sin amenazas.";
        pasos[fila] = new QueenStepDto(fila + 1, fila, columna, notacion, esSeguro, mensaje);
        llenarPasosRecursivo(pasos, fila + 1);
    }

    /**
     * Verifica recursivamente si una reina en (fila, columna) entra en conflicto con las reinas previas.
     * 
     * @param fila Fila de la reina a comprobar.
     * @param columna Columna de la reina a comprobar.
     * @param posiciones Arreglo de posiciones de las reinas colocadas.
     * @param indiceObjetivo Índice de la reina previa contra la que se evalúa.
     * @return true si es seguro colocarla, false en caso contrario.
     */
    public boolean esSeguroRecursivo(int fila, int columna, int[] posiciones, int indiceObjetivo) {
        if (indiceObjetivo < 0) return true;
        int columnaPrevia = posiciones[indiceObjetivo];
        if (columna == columnaPrevia || Math.abs(fila - indiceObjetivo) == Math.abs(columna - columnaPrevia)) {
            return false;
        }
        return esSeguroRecursivo(fila, columna, posiciones, indiceObjetivo - 1);
    }

    /**
     * Método de compatibilidad hacia atrás para esSeguroRecursivo.
     */
    public boolean isSafeRecursive(int row, int col, int[] positions, int targetIndex) {
        return esSeguroRecursivo(row, col, positions, targetIndex);
    }

    /**
     * Verifica recursivamente un arreglo de posiciones de reinas de tamaño n.
     * 
     * @param posiciones Arreglo de posiciones.
     * @param n Número de reinas a verificar.
     * @return true si todas son válidas y no se amenazan.
     */
    public boolean verificarTodoRecursivo(int[] posiciones, int n) {
        if (posiciones == null || n <= 1) return true;
        int ultimaFila = n - 1;
        return esSeguroRecursivo(ultimaFila, posiciones[ultimaFila], posiciones, ultimaFila - 1)
            && verificarTodoRecursivo(posiciones, n - 1);
    }

    /**
     * Método de compatibilidad hacia atrás para verificarTodoRecursivo.
     */
    public boolean verifyAllRecursive(int[] positions, int n) {
        return verificarTodoRecursivo(positions, n);
    }

    /**
     * Verifica recursivamente si una matriz de coordenadas [8][2] es válida.
     * 
     * @param matriz Matriz de coordenadas de las reinas.
     * @return true si la matriz representa una colocación válida sin amenazas.
     */
    public boolean verificarMatrizRecursiva(int[][] matriz) {
        if (matriz == null || matriz.length != TAMANO) return false;
        int[] posiciones = new int[TAMANO];
        if (!extraerPosicionesRecursivo(matriz, posiciones, 0)) return false;
        return verificarTodoRecursivo(posiciones, TAMANO);
    }

    /**
     * Método de compatibilidad hacia atrás para verificarMatrizRecursiva.
     */
    public boolean verifyMatrixRecursive(int[][] matrix) {
        return verificarMatrizRecursiva(matrix);
    }

    private boolean extraerPosicionesRecursivo(int[][] matriz, int[] posiciones, int i) {
        if (i >= TAMANO) return true;
        if (matriz[i] == null || matriz[i].length < 2) return false;
        int fila = matriz[i][0];
        int columna = matriz[i][1];
        if (fila < 0 || fila >= TAMANO || columna < 0 || columna >= TAMANO) return false;
        posiciones[fila] = columna;
        return extraerPosicionesRecursivo(matriz, posiciones, i + 1);
    }

    /**
     * Retorna la matriz 8x2 de la combinación fija establecida.
     * 
     * @return Matriz de coordenadas [8][2].
     */
    public int[][] obtenerMatrizSolucion() {
        int[][] matriz = new int[TAMANO][2];
        llenarMatrizSolucionRecursivo(matriz, 0);
        return matriz;
    }

    /**
     * Método de compatibilidad hacia atrás para obtenerMatrizSolucion.
     */
    public int[][] getSolutionMatrix() {
        return obtenerMatrizSolucion();
    }

    private void llenarMatrizSolucionRecursivo(int[][] matriz, int i) {
        if (i >= TAMANO) return;
        matriz[i][0] = i;
        matriz[i][1] = SOLUCION[i];
        llenarMatrizSolucionRecursivo(matriz, i + 1);
    }
}
