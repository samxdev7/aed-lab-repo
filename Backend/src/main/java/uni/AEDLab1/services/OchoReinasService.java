package uni.AEDLab1.services;

import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Service;
import uni.AEDLab1.models.EightQueensResponseDto;
import uni.AEDLab1.models.QueenStepDto;

/**
 * Servicio que gestiona la colocación y verificación recursiva del problema de las ocho reinas
 * en un tablero de ajedrez 8x8 con la combinación establecida.
 * Implementa algoritmos estrictamente recursivos en Java para validar amenazas mutuas.
 * 
 * @author samxdev7
 * @version 2.0
 */
@Service
public class OchoReinasService {

    public static final int TAMANO = 8;
    
    /**
     * Combinación de solución fija establecida para el tablero 8x8.
     * El índice representa la fila (0 a 7) y el valor representa la columna (0 a 7).
     * Corresponde a las casillas: a8, e7, h6, f5, c4, g3, b2, d1.
     */
    public static final int[] SOLUCION = {0, 4, 7, 5, 2, 6, 1, 3};

    /**
     * Resuelve y genera la traza secuencial de colocación de las 8 reinas,
     * verificando recursivamente cada una en cada paso sin amenazas.
     * 
     * @return EightQueensResponseDto con la matriz de solución, los pasos verificados y el mensaje.
     */
    public EightQueensResponseDto solveWithRecursiveTrace() {
        List<QueenStepDto> steps = new ArrayList<>();
        int[] placed = new int[TAMANO];

        for (int r = 0; r < TAMANO; r++) {
            int c = SOLUCION[r];
            placed[r] = c;

            // Verificación puramente recursiva contra las reinas previamente colocadas (0 a r - 1)
            boolean safe = isSafeRecursive(r, c, placed, r - 1);

            char file = (char) ('a' + c);
            int rank = 8 - r;
            String notation = "REINA " + (r + 1) + " [" + Character.toUpperCase(file) + rank + "]";
            String msg = "Reina " + (r + 1) + " colocada en (" + r + ", " + c + ") y verificada recursivamente sin amenazas.";

            steps.add(new QueenStepDto(r + 1, r, c, notation, safe, msg));
        }

        int[][] solutionMatrix = getSolutionMatrix();
        boolean allValid = verifyAllRecursive(SOLUCION, TAMANO);

        return new EightQueensResponseDto(
            solutionMatrix,
            steps,
            allValid,
            "Las ocho reinas de la combinación establecida fueron verificadas recursivamente sin amenazas mutuas."
        );
    }

    /**
     * Verifica recursivamente si una reina en (row, col) entra en conflicto con las reinas
     * registradas en índices de 0 hasta targetIndex.
     * 
     * @param row Fila de la reina a evaluar.
     * @param col Columna de la reina a evaluar.
     * @param positions Arreglo de posiciones donde positions[i] = columna de la reina en fila i.
     * @param targetIndex Índice de la reina previa a evaluar contra la actual.
     * @return true si no existe ninguna amenaza entre la reina y las reinas hasta targetIndex; false si se amenazan.
     */
    public boolean isSafeRecursive(int row, int col, int[] positions, int targetIndex) {
        // Caso base: se revisaron todas las reinas previas sin conflictos
        if (targetIndex < 0) {
            return true;
        }

        int prevRow = targetIndex;
        int prevCol = positions[targetIndex];

        // Detección de amenaza: misma fila, misma columna o misma diagonal
        if (row == prevRow || col == prevCol || Math.abs(row - prevRow) == Math.abs(col - prevCol)) {
            return false;
        }

        // Llamada recursiva hacia la reina anterior
        return isSafeRecursive(row, col, positions, targetIndex - 1);
    }

    /**
     * Verifica recursivamente un arreglo de posiciones de reinas de tamaño n.
     * 
     * @param positions Arreglo de tamaño TAMANO con las columnas de cada reina por fila.
     * @param n Número de reinas colocadas a validar (de 1 a TAMANO).
     * @return true si ninguna de las n reinas se amenaza mutuamente; false en caso contrario.
     */
    public boolean verifyAllRecursive(int[] positions, int n) {
        if (positions == null || n <= 1) {
            return true;
        }

        int lastRow = n - 1;
        int lastCol = positions[lastRow];

        // Validar recursivamente la última reina contra todas las anteriores
        if (!isSafeRecursive(lastRow, lastCol, positions, lastRow - 1)) {
            return false;
        }

        // Llamada recursiva para validar el subconjunto de n - 1 reinas
        return verifyAllRecursive(positions, n - 1);
    }

    /**
     * Verifica recursivamente si una matriz de reinas [N][2] es válida y libre de amenazas.
     * 
     * @param queensMatrix Matriz de N reinas con coordenadas [fila, columna].
     * @return true si ninguna se amenaza mutuamente y hay 8 reinas sin conflicto.
     */
    public boolean verifyMatrixRecursive(int[][] queensMatrix) {
        if (queensMatrix == null || queensMatrix.length != TAMANO) {
            return false;
        }

        int[] positions = new int[TAMANO];
        for (int i = 0; i < TAMANO; i++) {
            if (queensMatrix[i] == null || queensMatrix[i].length < 2) {
                return false;
            }
            int row = queensMatrix[i][0];
            int col = queensMatrix[i][1];
            if (row < 0 || row >= TAMANO || col < 0 || col >= TAMANO) {
                return false;
            }
            positions[row] = col;
        }

        return verifyAllRecursive(positions, TAMANO);
    }

    /**
     * Retorna la matriz 8x2 de la combinación fija establecida.
     * 
     * @return int[8][2] con coordenadas [fila, columna].
     */
    public int[][] getSolutionMatrix() {
        int[][] matrix = new int[TAMANO][2];
        for (int i = 0; i < TAMANO; i++) {
            matrix[i][0] = i;
            matrix[i][1] = SOLUCION[i];
        }
        return matrix;
    }
}
