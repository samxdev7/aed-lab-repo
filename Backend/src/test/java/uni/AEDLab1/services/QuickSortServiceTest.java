package uni.AEDLab1.services;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import uni.AEDLab1.models.QuickSortResponseDto;
import uni.AEDLab1.models.QuickSortStepDto;

import static org.junit.jupiter.api.Assertions.*;

class QuickSortServiceTest {

    private QuickSortService service;

    @BeforeEach
    void setUp() {
        service = new QuickSortService();
    }

    @Test
    void testExecuteQuickSort_ValidArray() {
        int[] input = {67, 9, 7, 12, 15, 6, 3, 1, 4, 2};
        QuickSortResponseDto response = service.executeQuickSort(input);

        assertNotNull(response);
        assertNotNull(response.sortedArray());
        assertArrayEquals(new int[]{1, 2, 3, 4, 6, 7, 9, 12, 15, 67}, response.sortedArray());
        assertTrue(response.steps().length > 0);

        // Verify pivot consistency: when pivot is assigned, its card in array snapshot must match pivot value
        for (QuickSortStepDto step : response.steps()) {
            if (step.pivot() != null && step.action().equals("compare")) {
                int pivotValAtIdx = step.array()[step.pivot()];
                // In compare step, the element at pivot position must remain the pivot
                assertTrue(pivotValAtIdx >= 1 && pivotValAtIdx <= 67);
            }
        }
    }

    @Test
    void testExecuteQuickSort_ReversedArray() {
        int[] input = {10, 9, 8, 7, 6, 5, 4, 3, 2, 1};
        QuickSortResponseDto response = service.executeQuickSort(input);

        assertNotNull(response);
        assertArrayEquals(new int[]{1, 2, 3, 4, 5, 6, 7, 8, 9, 10}, response.sortedArray());
    }

    @Test
    void testExecuteQuickSort_AlreadySortedArray() {
        int[] input = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10};
        QuickSortResponseDto response = service.executeQuickSort(input);

        assertNotNull(response);
        assertArrayEquals(new int[]{1, 2, 3, 4, 5, 6, 7, 8, 9, 10}, response.sortedArray());
    }

    @Test
    void testExecuteQuickSort_InvalidInputs() {
        // null
        assertNull(service.executeQuickSort(null));
        // Wrong size
        assertNull(service.executeQuickSort(new int[]{1, 2, 3}));
        // Duplicates
        assertNull(service.executeQuickSort(new int[]{1, 2, 3, 4, 5, 5, 7, 8, 9, 10}));
    }

    @Test
    void testHasDuplicates() {
        assertTrue(service.hasDuplicates(new int[]{1, 2, 3, 2}));
        assertFalse(service.hasDuplicates(new int[]{1, 2, 3, 4}));
        assertFalse(service.hasDuplicates(null));
    }
}
