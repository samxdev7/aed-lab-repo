package uni.AEDLab1.services;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import uni.AEDLab1.models.EightQueensResponseDto;
import uni.AEDLab1.models.QueenStepDto;

import static org.junit.jupiter.api.Assertions.*;

class OchoReinasServiceTest {

    private OchoReinasService servicio;

    @BeforeEach
    void setUp() {
        servicio = new OchoReinasService();
    }

    @Test
    void testResolverConTrazaRecursiva() {
        EightQueensResponseDto respuesta = servicio.resolverConTrazaRecursiva();

        assertNotNull(respuesta);
        assertTrue(respuesta.esValido(), "La combinación establecida debe ser válida");
        assertEquals(8, respuesta.pasos().length, "Debe contener exactamente 8 pasos");
        assertNotNull(respuesta.solucion());
        assertEquals(8, respuesta.solucion().length);

        assertPasosValidosRecursivos(respuesta.pasos(), 0);
    }

    private void assertPasosValidosRecursivos(QueenStepDto[] pasos, int i) {
        if (i >= pasos.length) return;
        QueenStepDto paso = pasos[i];
        assertTrue(paso.verificado(), "Cada paso debe verificarse recursivamente sin amenazas");
        assertTrue(paso.fila() >= 0 && paso.fila() < 8);
        assertTrue(paso.columna() >= 0 && paso.columna() < 8);
        assertNotNull(paso.notacion());
        assertPasosValidosRecursivos(pasos, i + 1);
    }

    @Test
    void testEsSeguroRecursivo() {
        // [0, 4, 7, 5, 2, 6, 1, 3]
        int[] solucion = {0, 4, 7, 5, 2, 6, 1, 3};

        // Reina 0 en (0, 0): no tiene reinas previas (-1)
        assertTrue(servicio.esSeguroRecursivo(0, 0, solucion, -1));

        // Reina 1 en (1, 4): segura contra reina 0 en (0, 0)
        assertTrue(servicio.esSeguroRecursivo(1, 4, solucion, 0));

        // Reina con amenaza en misma columna: (1, 0) contra (0, 0)
        assertFalse(servicio.esSeguroRecursivo(1, 0, solucion, 0));

        // Reina con amenaza en diagonal principal: (1, 1) contra (0, 0)
        assertFalse(servicio.esSeguroRecursivo(1, 1, solucion, 0));

        // Reina con amenaza en diagonal inversa: (1, 3) contra (0, 4)
        int[] arregloPrueba = {4};
        assertFalse(servicio.esSeguroRecursivo(1, 3, arregloPrueba, 0));
    }

    @Test
    void testVerificarTodoRecursivo() {
        int[] solucionValida = {0, 4, 7, 5, 2, 6, 1, 3};
        assertTrue(servicio.verificarTodoRecursivo(solucionValida, 8), "La solución válida debe retornar true");

        // Solución con amenaza en misma columna
        int[] invalidaCol = {0, 0, 7, 5, 2, 6, 1, 3};
        assertFalse(servicio.verificarTodoRecursivo(invalidaCol, 8), "Misma columna debe retornar false");

        // Solución con amenaza en misma diagonal
        int[] invalidaDiag = {0, 1, 2, 3, 4, 5, 6, 7};
        assertFalse(servicio.verificarTodoRecursivo(invalidaDiag, 8), "Misma diagonal debe retornar false");
    }

    @Test
    void testVerificarMatrizRecursiva() {
        int[][] matrizValida = servicio.obtenerMatrizSolucion();
        assertTrue(servicio.verificarMatrizRecursiva(matrizValida));

        assertFalse(servicio.verificarMatrizRecursiva(null));
        assertFalse(servicio.verificarMatrizRecursiva(new int[3][2]));
    }
}
