package uni.AEDLab1.services;

import uni.AEDLab1.models.TorresHanoiDto;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.List;

@Service
public class TorresHanoiServicio {

    public List<TorresHanoiDto> resolverHanoi(int n) {
        List<TorresHanoiDto> pasos = new ArrayList<>();
        algoritmoHanoi(n, "A", "C", "B", pasos);        return pasos;
    }

    private void algoritmoHanoi(int n, String origen, String destino, String auxiliar, List<TorresHanoiDto> pasos) {
        if (n == 1) {
            pasos.add(new TorresHanoiDto(1, origen, destino));
        } else {
            algoritmoHanoi(n - 1, origen, auxiliar, destino, pasos);
            pasos.add(new TorresHanoiDto(n, origen, destino));
            algoritmoHanoi(n - 1, auxiliar, destino, origen, pasos);
        }
    }
}