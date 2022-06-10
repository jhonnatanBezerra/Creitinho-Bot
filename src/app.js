const venom = require('venom-bot');
const express = require('express');
const cors = require('cors');
const { parsePhoneNumber, isValidPhoneNumber } = require('libphonenumber-js');
const fs = require('fs');
const path = require('path');
const os = require('os');

const multer = require('multer');
const upload = multer({})



const app = express();
app.use(express.json());
app.use(cors());


app.listen(3333, () => {

  venom
    .create({
      // headless: false,
      session: 'session-name', //name of session
      multidevice: true, // for version not multidevice use false.(default: true)
      statusFind: (statusSession) => {
        console.log('Status Session =====================>  ', statusSession); //return isLogged || notLogged || browserClose || qrReadSuccess || qrReadFail || autocloseCalled || desconnectedMobile || deleteToken || chatsAvailable || deviceNotConnected || serverWssNotConnected || noOpenBrowser || initBrowser || openBrowser || connectBrowserWs || initWhatsapp || erroPageWhatsapp || successPageWhatsapp || waitForLogin || waitChat || successChat

      },

      catchQR: (qrCode) => {
        let matches = qrCode.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        let response = {};


        if (matches.length !== 3) {
          return new Error('Invalid input string');
        }

        response.type = matches[1];
        response.data = new Buffer.from(matches[2], 'base64');

        var imageBuffer = response;
        fs.writeFile('./qrcode/creitinQRCode.png', imageBuffer['data'], 'binary', err => { err !== null ? console.log(err) : console.log('Arquivo criado com sucesso') });


      }
    })
    .then((client) => {
      initAplication(client)
    })
    .catch((erro) => {
      console.log(erro);
    });

  const initAplication = (client) => {


    app.get('/status', async (req, res) => {



      // const connected = ['isLogged', 'qrReadSucess', 'chatsAvaliable'].includes

      const response = await client.getConnectionState();

      res.status(200).send({ status: response });

      // client.onStateChange(state => {
      //   console.log('chamada de status ===>', state);
      // });



      // res.send(response)

    })

    app.post('/sendMessage', upload.single('file'), async (req, res) => {

      if (req.file) {

        sendImage(req, client, res);

      } else {

        senMessage(req, client, res);
      }

    })

    // app.post('/sendImg', upload.single('file'), async (req, res) => {



    //   await sendImage(req, client, res);



    // })


  }


});

const validadeNumberPhone = (number, ddd) => {
  let phoneNumber = ddd + number;

  if (!isValidPhoneNumber(phoneNumber, "BR")) {
    // res.sendStatus(404);
    throw new Error('Número inválido ---> ', phoneNumber);
  }

  if (phoneNumber.length === 10) {
    phoneNumber = ddd + 9 + number;
  }

  phoneNumber = parsePhoneNumber(phoneNumber, 'BR').format('E.164');

  phoneNumber = phoneNumber.includes('@c.us')
    ? phoneNumber
    : `${phoneNumber}@c.us`

  phoneNumber = phoneNumber.replace('+', '');

  return phoneNumber;
}

const sendImage = async (request, client, response) => {

  const { number, ddd, message } = request.body;

  var folderName = fs.mkdtempSync(path.join(os.tmpdir(), 'creitinho-boot' + '-'));
  var filePath = path.join(folderName, request.file.originalname);
  fs.writeFileSync(filePath, request.file.buffer.toString('base64'), 'base64');


  try {

    const data = await client.sendFile(validadeNumberPhone(number, ddd), filePath, request.file.originalname, message);
    response.status(200).send({ message: 'Mensagem enviada com sucesso !', data });

  } catch (error) {
    response.status(400).send({ message: 'Erro ao enviar mensagem', error });
  }

}

const senMessage = async (request, client, response) => {
  const { message, number, ddd } = request.body;

  try {
    const data = await client.sendText(validadeNumberPhone(number, ddd), message)

    response.status(200).send({ message: 'Mensagem enviada com sucesso !', data });

  } catch (error) {
    response.status(400).send({ message: 'Erro ao enviar mensagem', error });
  }
}
