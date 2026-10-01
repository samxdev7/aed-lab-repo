package uni.AEDLab1.services;

import org.springframework.stereotype.Service;
import uni.AEDLab1.models.EightQueensResponseDto;
import uni.AEDLab1.models.QueenStepDto;

/**
 * Servicio que gestiona la verificación recursiva del problema de las 8 reinas (8x8).
 * Utiliza exclusivamente arreglos estáticos y validación recursiva pura sin bucles para amenazas.
 */
@Service
public class OchoReinasService {

    public static final int TAMANO = 8;
    public static final int[] SOLUCION = {0, 4, 7, 5, 2, 6, 1, 3};

    /**
     * Genera la traza paso a paso de colocación y verificación recursiva de las 8 reinas.
     */
    public EightQueensResponseDto solveWithRecursiveTrace() {
        QueenStepDto[] steps = new QueenStepDto[TAMANO];
        for (int r = 0; r < TAMANO; r++) {
            int c = SOLUCION[r];
            boolean safe = isSafeRecursive(r, c, SOLUCION, r - 1);
            String notation = "REINA " + (r + 1) + " [" + (char) ('A' + c) + (8 - r) + "]";
            String msg = "Reina " + (r + 1) + " colocada en (" + r + ", " + c + ") y verificada recursivamente sin amenazas.";
            steps[r] = new QueenStepDto(r + 1, r, c, notation, safe, msg);
        }

        return new EightQueensResponseDto(
            getSolutionMatrix(),
            steps,
            verifyAllRecursive(SOLUCION, TAMANO),
            "Las ocho reinas fueron verificadas recursivamente sin amenazas mutuas."
        );
    }

    /**
     * Verifica recursivamente si una reina en (row, col) entra en conflicto con las reinas previas.
     */
    public boolean isSafeRecursive(int row, int col, int[] positions, int targetIndex) {
        if (targetIndex < 0) return true;
        int prevCol = positions[targetIndex];
        if (col == prevCol || Math.abs(row - targetIndex) == Math.abs(col - prevCol)) {
            return false;
        }
        return isSafeRecursive(row, col, positions, targetIndex - 1);
    }

    /**
     * Verifica recursivamente un arreglo de posiciones de reinas de tamaño n.
     */
    public boolean verifyAllRecursive(int[] positions, int n) {
        if (positions == null || n <= 1) return true;
        int lastRow = n - 1;
        return isSafeRecursive(lastRow, positions[lastRow], positions, lastRow - 1)
            && verifyAllRecursive(positions, n - 1);
    }

    /**
     * Verifica recursivamente si una matriz de coordenadas [8][2] es válida.
     */
    public boolean verifyMatrixRecursive(int[][] matrix) {
        if (matrix == null || matrix.length != TAMANO) return false;
        int[] pos = new int[TAMANO];
        for (int i = 0; i < TAMANO; i++) {
            if (matrix[i] == null || matrix[i].length < 2) return false;
            int r = matrix[i][0];
            int c = matrix[i][1];
            if (r < 0 || r >= TAMANO || c < 0 || c >= TAMANO) return false;
            pos[r] = c;
        }
        return verifyAllRecursive(pos, TAMANO);
    }

    /**
     * Retorna la matriz 8x2 de la combinación fija establecida.
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
