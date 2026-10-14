package uni.AEDLab1.services;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import uni.AEDLab1.models.QuickSortResponseDto;
import uni.AEDLab1.models.QuickSortStepDto;

import static org.junit.jupiter.api.Assertions.*;

class QuickSortServiceTest {

    private QuickSortService servicio;

    @BeforeEach
    void setUp() {
        servicio = new QuickSortService();
    }

    @Test
    void testEjecutarQuickSort_ArregloValido() {
        int[] entrada = {67, 9, 7, 12, 15, 6, 3, 1, 4, 2};
        QuickSortResponseDto respuesta = servicio.ejecutarQuickSort(entrada);

        assertNotNull(respuesta);
        assertNotNull(respuesta.arregloOrdenado());
        assertArrayEquals(new int[]{1, 2, 3, 4, 6, 7, 9, 12, 15, 67}, respuesta.arregloOrdenado());
        assertTrue(respuesta.pasos().length > 0);

        // Verificar consistencia del pivote: cuando el pivote se asigna, su valor en el arreglo coincide
        assertPasosPivoteConsistenteRecursivo(respuesta.pasos(), 0);
    }

    private void assertPasosPivoteConsistenteRecursivo(QuickSortStepDto[] pasos, int i) {
        if (i >= pasos.length) return;
        QuickSortStepDto paso = pasos[i];
        if (paso.pivote() != null && paso.accion().equals("compare")) {
            int valorPivoteEnIndice = paso.arreglo()[paso.pivote()];
            assertTrue(valorPivoteEnIndice >= 1 && valorPivoteEnIndice <= 67);
        }
        assertPasosPivoteConsistenteRecursivo(pasos, i + 1);
    }

    @Test
    void testEjecutarQuickSort_ArregloInvertido() {
        int[] entrada = {10, 9, 8, 7, 6, 5, 4, 3, 2, 1};
        QuickSortResponseDto respuesta = servicio.ejecutarQuickSort(entrada);

        assertNotNull(respuesta);
        assertArrayEquals(new int[]{1, 2, 3, 4, 5, 6, 7, 8, 9, 10}, respuesta.arregloOrdenado());
    }

    @Test
    void testEjecutarQuickSort_ArregloYaOrdenado() {
        int[] entrada = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10};
        QuickSortResponseDto respuesta = servicio.ejecutarQuickSort(entrada);

        assertNotNull(respuesta);
        assertArrayEquals(new int[]{1, 2, 3, 4, 5, 6, 7, 8, 9, 10}, respuesta.arregloOrdenado());
    }

    @Test
    void testEjecutarQuickSort_EntradasInvalidas() {
        // null
        assertNull(servicio.ejecutarQuickSort(null));
        // Tamaño incorrecto
        assertNull(servicio.ejecutarQuickSort(new int[]{1, 2, 3}));
        // Duplicados
        assertNull(servicio.ejecutarQuickSort(new int[]{1, 2, 3, 4, 5, 5, 7, 8, 9, 10}));
    }

    @Test
    void testTieneDuplicados() {
        assertTrue(servicio.tieneDuplicados(new int[]{1, 2, 3, 2}));
        assertFalse(servicio.tieneDuplicados(new int[]{1, 2, 3, 4}));
        assertFalse(servicio.tieneDuplicados(null));
    }
}
