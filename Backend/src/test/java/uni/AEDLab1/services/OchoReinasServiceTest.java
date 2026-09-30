package uni.AEDLab1.services;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import uni.AEDLab1.models.EightQueensResponseDto;
import uni.AEDLab1.models.QueenStepDto;

import static org.junit.jupiter.api.Assertions.*;

class OchoReinasServiceTest {

    private OchoReinasService service;

    @BeforeEach
    void setUp() {
        service = new OchoReinasService();
    }

    @Test
    void testSolveWithRecursiveTrace() {
        EightQueensResponseDto response = service.solveWithRecursiveTrace();

        assertNotNull(response);
        assertTrue(response.valid(), "La combinación establecida debe ser válida");
        assertEquals(8, response.steps().size(), "Debe contener exactamente 8 pasos");
        assertNotNull(response.solution());
        assertEquals(8, response.solution().length);

        for (QueenStepDto step : response.steps()) {
            assertTrue(step.verified(), "Cada paso debe verificarse recursivamente sin amenazas");
            assertTrue(step.row() >= 0 && step.row() < 8);
            assertTrue(step.col() >= 0 && step.col() < 8);
            assertNotNull(step.notation());
        }
    }

    @Test
    void testIsSafeRecursive() {
        // [0, 4, 7, 5, 2, 6, 1, 3]
        int[] solution = {0, 4, 7, 5, 2, 6, 1, 3};

        // Reina 0 en (0, 0): no tiene reinas previas (-1)
        assertTrue(service.isSafeRecursive(0, 0, solution, -1));

        // Reina 1 en (1, 4): segura contra reina 0 en (0, 0)
        assertTrue(service.isSafeRecursive(1, 4, solution, 0));

        // Reina con amenaza en misma columna: (1, 0) contra (0, 0)
        assertFalse(service.isSafeRecursive(1, 0, solution, 0));

        // Reina con amenaza en diagonal principal: (1, 1) contra (0, 0)
        assertFalse(service.isSafeRecursive(1, 1, solution, 0));

        // Reina con amenaza en diagonal inversa: (1, 3) contra (0, 4)
        int[] testArr = {4};
        assertFalse(service.isSafeRecursive(1, 3, testArr, 0));
    }

    @Test
    void testVerifyAllRecursive() {
        int[] validSolution = {0, 4, 7, 5, 2, 6, 1, 3};
        assertTrue(service.verifyAllRecursive(validSolution, 8), "La solución válida debe retornar true");

        // Solución con amenaza en misma columna
        int[] invalidCol = {0, 0, 7, 5, 2, 6, 1, 3};
        assertFalse(service.verifyAllRecursive(invalidCol, 8), "Misma columna debe retornar false");

        // Solución con amenaza en misma diagonal
        int[] invalidDiag = {0, 1, 2, 3, 4, 5, 6, 7};
        assertFalse(service.verifyAllRecursive(invalidDiag, 8), "Misma diagonal debe retornar false");
    }

    @Test
    void testVerifyMatrixRecursive() {
        int[][] validMatrix = service.getSolutionMatrix();
        assertTrue(service.verifyMatrixRecursive(validMatrix));

        assertFalse(service.verifyMatrixRecursive(null));
        assertFalse(service.verifyMatrixRecursive(new int[3][2]));
    }
}
