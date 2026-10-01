package uni.AEDLab1.models;

/**
 * Respuesta inmutable para el problema de las ocho reinas (tablero 8x8).
 */
public record EightQueensResponseDto(
    int[][] solution,
    QueenStepDto[] steps,
    boolean valid,
    String message
) {}
