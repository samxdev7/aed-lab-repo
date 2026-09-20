package uni.AEDLab1.services;

import uni.AEDLab1.models.TorresHanoiDto;
import org.springframework.stereotype.Service;

@Service
public class TorresHanoiServicio {

    // Índice para llevar el control de la posición dentro del arreglo
    private int indice;

    public TorresHanoiDto[] resolverHanoi(int n) {
        // El número total de movimientos en las Torres de Hanoi es (2^n) - 1
        int totalMovimientos = (int) Math.pow(2, n) - 1;
        TorresHanoiDto[] pasos = new TorresHanoiDto[totalMovimientos];
        
        // Reiniciamos el índice antes de ejecutar la recursión
        this.indice = 0;
        
        algoritmoHanoi(n, "A", "C", "B", pasos);
        return pasos;
    }

    private void algoritmoHanoi(int n, String origen, String destino, String auxiliar, TorresHanoiDto[] pasos) {
        if (n == 1) {
            pasos[indice++] = new TorresHanoiDto(1, origen, destino);
        } else {
            algoritmoHanoi(n - 1, origen, auxiliar, destino, pasos);
            pasos[indice++] = new TorresHanoiDto(n, origen, destino);
            algoritmoHanoi(n - 1, auxiliar, destino, origen, pasos);
        }
    }
}